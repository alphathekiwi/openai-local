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
python -m pip install django requests
```