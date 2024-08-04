## ABOUT PROJECT
The goals of this project were simple
- Send queries to OpenAI's API
- Use vanilla JS and HTML for everything on the frontend to keep it simple and readable
- Parse the markdown response it returned into HTML
- Store the conversation in a database for later reference
    *None of the conversation's previous messages are passed to the AI as context*
    *this is intended and can be verified by asking "What did i ask last?"*

## SETUP STEPS

### Linux
```bash
sudo apt-get install python3-venv    # If needed
python3 -m venv .venv
source .venv/bin/activate
```

### macOS
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Windows
```bash
py -3 -m venv .venv
.venv\scripts\activate
```
*Or if using git bash*
```bash
source .venv\scripts\activate
```

## INSTALL DEPENDANCIES
```bash
python -m pip install django openai requests channels["daphne"]
```
## Collect static files
```bash
python manage.py collectstatic --noinput
```