# Google Search Tool

A tool that integrates with the Serper.dev API to perform Google searches directly from Kode.

## Setup

1. **Get a Serper API Key**
   - Visit https://serper.dev and sign up for a free account
   - You get 2,500 free searches per month
   - Copy your API key from the dashboard

2. **Set Environment Variable**
   ```bash
   export SERPER_API_KEY="your-api-key-here"
   ```

   Or add to your shell profile (`.bashrc`, `.zshrc`, etc.):
   ```bash
   echo 'export SERPER_API_KEY="your-api-key-here"' >> ~/.zshrc
   ```

## Usage

Once configured, the tool will be available in Kode conversations:

```
User: Search for the latest React 19 features