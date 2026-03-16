# Default Agent Setup — JCI Invoice Processing

This document covers how to configure the agentic Logic App's Default Agent
for invoice processing. Use this alongside workflow.json.

---

## Architecture Decision

There are two approaches. Use the one that fits your needs:

| | Standard Workflow (workflow.json) | Agentic Default Agent |
|---|---|---|
| Reliability | High — deterministic | Medium — LLM may hallucinate tool calls |
| Flexibility | Fixed steps | Agent can handle unexpected cases |
| Debugging | Easy — each step visible | Harder — agent reasoning is opaque |
| Best for | Production, high volume | Pilot, complex routing decisions |

**Recommendation for now:** Use the standard workflow.json for production.
Use the Default Agent once you want the agent to do more (e.g. web searches,
supplier lookups, anomaly reasoning).

---

## Default Agent System Prompt

Copy this into the "Instructions" field of your Default Agent step:

```
You are an invoice processing agent for JCI Mining's Accounts Payable team.

When triggered by a new email arriving at invoices@jcimining.co.za, your job is:
1. Inspect the email for PDF attachments
2. For each PDF attachment, call the AnalyzeInvoice tool to extract invoice data
3. For each extracted invoice, call the SaveInvoice tool to save it to the database and run matching
4. Report a summary of what was processed

Rules:
- Only process PDF attachments. Ignore .docx, .xlsx, images, and other file types.
- One email can have multiple invoice PDFs. Process each one separately.
- If AnalyzeInvoice fails for a file, log the error and continue with remaining attachments.
- If SaveInvoice fails, log the error and continue. Do not retry automatically.
- Never modify extracted data. Pass it exactly as returned by AnalyzeInvoice.
- Currency defaults to ZAR if not found on the invoice.
- Do not approve or reject invoices. Your job is extraction and saving only.

After processing all attachments, respond with a brief summary:
"Processed X invoice(s) from [sender email]. Results: [list each file and its match status]"
```

---

## Cases (Tools) to Define

In the Default Agent step, add two Cases:

---

### Case 1: AnalyzeInvoice

**Description for agent:**
```
Analyzes a PDF invoice attachment using Azure AI Content Understanding.
Call this for each PDF attachment in the email.
Input: the base64-encoded PDF content and the filename.
Returns: extracted invoice fields (supplier, amounts, bank details, line items).
```

**Action inside this Case:**
- Type: HTTP
- Method: POST
- URL: `https://JCIProd-resource-8806.cognitiveservices.azure.com/contentunderstanding/analyzers/Invoices:syncAnalyze?api-version=2024-12-01-preview`
- Headers:
  - `Ocp-Apim-Subscription-Key`: [your Content Understanding key]
  - `Content-Type`: application/json
- Body:
```json
{
  "content": "@{triggerBody()?['content']}"
}
```

**What the Case returns to the agent:**
The full JSON response from Content Understanding, including all extracted fields.

---

### Case 2: SaveInvoice

**Description for agent:**
```
Saves an extracted invoice to the JCI database and runs the matching engine.
Call this after AnalyzeInvoice has returned extracted fields.
Input: the extracted fields plus the filename and received date from the email.
Returns: the new InvoiceHeaderId, match score (0-100), and match status.
```

**Action inside this Case:**
- Type: HTTP
- Method: POST
- URL: `https://jciinvoiceapp-dwd4cda8hwbverc2.southafricanorth-01.azurewebsites.net/api/invoices/ingest`
- Headers:
  - `Content-Type`: application/json
- Body: the fields extracted from Case 1, structured as:
```json
{
  "fileName": "<attachment name>",
  "sourceMailbox": "invoices@jcimining.co.za",
  "receivedDateTime": "<email received date>",
  "SupplierName": "<from extracted fields>",
  "SupplierVatNumber": "<from extracted fields>",
  "InvoiceNumber": "<from extracted fields>",
  "InvoiceDate": "<from extracted fields>",
  "PurchaseOrderNumber": "<from extracted fields>",
  "Currency": "<from extracted fields or ZAR>",
  "SubtotalAmount": "<number>",
  "VatAmount": "<number>",
  "TotalAmount": "<number>",
  "BankName": "<from extracted fields>",
  "BankAccountNumber": "<from extracted fields>",
  "BankBranchCode": "<from extracted fields>",
  "LineItems": "<array from extracted fields>"
}
```

---

## Content Understanding Response Structure

When mapping fields in the Logic App, use these expression paths:

```
Fields object:  body('Analyze_Invoice_Document')?['result']?['contents']?[0]?['fields']

Individual fields:
  SupplierName:        ...['SupplierName']?['valueString']
  SupplierVatNumber:   ...['SupplierVatNumber']?['valueString']
  InvoiceNumber:       ...['InvoiceNumber']?['valueString']
  InvoiceDate:         ...['InvoiceDate']?['valueDate']        ← note: valueDate not valueString
  PurchaseOrderNumber: ...['PurchaseOrderNumber']?['valueString']
  Currency:            ...['Currency']?['valueString']
  SubtotalAmount:      ...['SubtotalAmount']?['valueNumber']   ← note: valueNumber
  VatAmount:           ...['VatAmount']?['valueNumber']
  TotalAmount:         ...['TotalAmount']?['valueNumber']
  BankName:            ...['BankName']?['valueString']
  BankAccountNumber:   ...['BankAccountNumber']?['valueString']
  BankBranchCode:      ...['BankBranchCode']?['valueString']
  LineItems:           ...['LineItems']?['valueArray']          ← array of objects
```

### LineItems structure

Each element in `valueArray` is an object with `valueObject` containing the line fields:
```json
{
  "type": "object",
  "valueObject": {
    "Description": { "valueString": "Hydraulic filter" },
    "Quantity":    { "valueNumber": 2 },
    "UnitPrice":   { "valueNumber": 450.00 },
    "Amount":      { "valueNumber": 900.00 }
  }
}
```

The `/api/invoices/ingest` endpoint accepts the raw `valueArray` — it does not
currently unpack the `valueObject` wrapper. If you want line items saved,
transform the array before posting, OR update the ingest endpoint to handle
the nested `valueObject` format.

Simple transform in a Logic App Compose step:
```
@array(
  map(
    outputs('Extract_Fields')?['fields']?['LineItems']?['valueArray'],
    item => {
      'Description': item?['valueObject']?['Description']?['valueString'],
      'Quantity':    item?['valueObject']?['Quantity']?['valueNumber'],
      'UnitPrice':   item?['valueObject']?['UnitPrice']?['valueNumber'],
      'Amount':      item?['valueObject']?['Amount']?['valueNumber']
    }
  )
)
```
Note: Logic Apps does not support inline `map()` — use a Select action instead
(see step-by-step guide below).

---

## Step-by-Step: Setting Up in Logic App Designer

### Option A — Import workflow.json (Standard, recommended)

1. Open your Logic App in Azure Portal
2. Go to **Logic App Designer** → switch to **Code View**
3. Paste the contents of `workflow.json`
4. In the Parameters section, fill in:
   - `cuEndpoint`: `https://JCIProd-resource-8806.cognitiveservices.azure.com/`
   - `cuApiKey`: your Content Understanding key (find in Azure portal under the resource → Keys)
   - `jciAppUrl`: `https://jciinvoiceapp-dwd4cda8hwbverc2.southafricanorth-01.azurewebsites.net`
5. Set up the Office 365 connection when prompted
6. Save and test by sending a PDF email to invoices@jcimining.co.za

### Option B — Configure Default Agent manually

1. Open Logic App Designer
2. Add trigger: **When a new email arrives in a shared mailbox (V2)**
   - Mailbox: `invoices@jcimining.co.za`
   - Include Attachments: Yes
   - Fetch only with attachments: Yes
3. Add action: **Default Agent** (search "Agent" in the connector list)
4. In the Default Agent:
   - Paste the system prompt above into Instructions
   - Add Case 1 "AnalyzeInvoice" (HTTP action to Content Understanding)
   - Add Case 2 "SaveInvoice" (HTTP action to /api/invoices/ingest)
5. In the User Message field, use an expression like:
   ```
   Process this email:
   From: @{triggerBody()?['From']}
   Subject: @{triggerBody()?['Subject']}
   Received: @{triggerBody()?['ReceivedDateTime']}
   Attachments: @{string(triggerBody()?['Attachments'])}
   ```

### Transform LineItems with a Select action (for correct DB format)

Add a **Select** action between Extract_Fields and Save_Invoice_to_DB:
- From: `@outputs('Extract_Fields')?['fields']?['LineItems']?['valueArray']`
- Map (Key → Value):
  - `Description` → `@item()?['valueObject']?['Description']?['valueString']`
  - `Quantity`    → `@item()?['valueObject']?['Quantity']?['valueNumber']`
  - `UnitPrice`   → `@item()?['valueObject']?['UnitPrice']?['valueNumber']`
  - `Amount`      → `@item()?['valueObject']?['Amount']?['valueNumber']`
- Then use `@body('Select')` as the `LineItems` value in Save_Invoice_to_DB

---

## Environment Variables to Set in Logic App Parameters

| Parameter | Value | Where to find it |
|---|---|---|
| `cuEndpoint` | `https://JCIProd-resource-8806.cognitiveservices.azure.com/` | Azure Portal → resource → Overview |
| `cuApiKey` | your key | Azure Portal → resource → Keys and Endpoint |
| `jciAppUrl` | your App Service URL | Azure Portal → App Service → Overview |

Keep `cuApiKey` as a **SecureString** parameter — never hardcode it in the workflow JSON.
Store it in Azure Key Vault and reference it via `@parameters('cuApiKey')`.

---

## Testing

Send a test email to invoices@jcimining.co.za with one of the sample PDFs attached.

After the Logic App runs, check:
1. Logic App run history for any failed actions
2. Your app at `/invoices` — the new invoice should appear in Active Queue
3. The match status should be set automatically (Matched / NeedsReview / Risk)

The invoice will NOT appear in history until it is Approved → Exported or Rejected.
