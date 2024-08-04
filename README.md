## ABOUT PROJECT
The goals of this project were simple
- Send queries to OpenAI's API
- Use vanilla JS and HTML for everything on the frontend to keep it simple and readable
- Parse the markdown response it returns into HTML without using a library
- Store the conversation in a database for later reference
    *None of the conversation's previous messages are passed to the AI as context*
    *this is intended and can be verified by asking "What did i ask last?"*
### Some interesting prompts
Since OpenAI doesn't know about which features I can parse on the frontend I made some queries to specifically target this
1. Render the tongan flag with html
2. List 5 gardening tips
3. What products are produced from burning petrol when responding use ^ to wrap text that should be super script and ~ to wrap text that should be subscript
4. Write a poem about cars that is 12 lines long and wrap every verb in the poem with two equals signs


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
## Make database migrations
```bash
python manage.py makemigrations
```
## Migrate database
```bash
python manage.py migrate
```