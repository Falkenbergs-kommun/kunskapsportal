# Office Documents Support Setup

This system now supports uploading and processing Word documents (.doc, .docx) and PowerPoint presentations (.ppt, .pptx) by automatically converting them to PDF for optimal OCR processing with Mistral.

## Supported Document Types

✅ **PDF Documents** - Direct processing  
✅ **Word Documents** - .doc, .docx (converts to PDF)  
✅ **PowerPoint Presentations** - .ppt, .pptx (converts to PDF)  
✅ **Excel Spreadsheets** - .xls, .xlsx (converts to PDF)  
✅ **Text Files** - .txt (direct processing)

## Processing Flow

1. **Upload** → Document uploaded to Media collection
2. **Detection** → System detects document type automatically  
3. **Conversion** → Office documents converted to PDF using LibreOffice
4. **OCR Processing** → PDF processed with Mistral OCR for text and image extraction
5. **Content Generation** → Structured markdown with embedded images
6. **Metadata Generation** → AI generates Swedish municipal metadata

## LibreOffice Installation

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install libreoffice
```

### CentOS/RHEL/Amazon Linux
```bash
sudo yum install libreoffice
# or
sudo dnf install libreoffice
```

### macOS
```bash
# Using Homebrew
brew install --cask libreoffice
```

### Docker
If running in Docker, add to your Dockerfile:
```dockerfile
RUN apt-get update && apt-get install -y \
    libreoffice \
    && rm -rf /var/lib/apt/lists/*
```

### Verification
Check that LibreOffice is installed and accessible:
```bash
libreoffice --version
# or
soffice --version
```

## Configuration

Set the PDF extractor to use Mistral for best OCR results:
```env
PDF_EXTRACTOR=mistral
MISTRAL_API_KEY=your_mistral_api_key
```

## How It Works

### For Users:
1. Upload any supported document type to an Article's "Source Documents"
2. Click "Generate with AI" 
3. System automatically:
   - Converts Office documents to PDF if needed
   - Extracts text and images using Mistral OCR
   - Generates structured content in Lexical format
   - Preserves images as embedded media

### For Developers:
- **DocumentConverter**: Handles LibreOffice conversions
- **Media Collection**: Extended with conversion status tracking
- **Processing Pipeline**: Automatic conversion before OCR
- **Error Handling**: Graceful fallbacks and user feedback

## Monitoring

### Media Collection Fields:
- **Document Type**: Auto-detected (e.g., "PowerPoint Presentation (.pptx)")
- **Conversion Status**: none | pending | success | failed  
- **Conversion Error**: Error message if conversion fails

### Console Logs:
```
[AI] Converting PowerPoint Presentation (.pptx) to PDF...
[AI] Conversion successful. New PDF size: 2,845,632 bytes
[AI] Processing PDF document with Mistral OCR...
```

## Troubleshooting

### Common Issues:

**"LibreOffice not available for conversion"**
- Install LibreOffice using instructions above
- Ensure `libreoffice` command is in PATH

**"Conversion failed"**
- Check document is not corrupted
- Verify sufficient disk space in temp directory
- Check LibreOffice can read the file format

**"Unsupported file type"** 
- Only listed file types are supported
- Convert manually to PDF if needed

### Performance Notes:
- Conversion adds 10-30 seconds to processing time
- Larger presentations (many slides) take longer to convert
- PDF files skip conversion and process immediately

## Benefits

### ✅ **Unified Processing**
All documents processed consistently through PDF → Mistral OCR pipeline

### ✅ **Better OCR Quality** 
Mistral OCR excels at text + image extraction from PDFs

### ✅ **Format Preservation**
LibreOffice conversion maintains layouts, formatting, and embedded images

### ✅ **User Experience**
Upload any office document - system handles conversion automatically

### ✅ **Municipal Compliance**
Supports all common Swedish municipal document formats