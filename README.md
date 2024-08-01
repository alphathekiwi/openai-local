## SETUP STEPS

### Linux
sudo apt-get install python3-venv    # If needed
python3 -m venv .venv
source .venv/bin/activate

### macOS
python3 -m venv .venv
source .venv/bin/activate

### Windows
py -3 -m venv .venv
.venv\scripts\activate
*Or if using git bash*
source .venv\scripts\activate

## INSTALL DEPENDANCIES
python -m pip install django requests