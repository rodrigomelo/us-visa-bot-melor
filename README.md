Installation
git clone https://github.com/rodrigomelo/us-visa-bot.git
cd us-visa-bot-melor
npm install

Configuration
Create a .env file in the project root with your credentials:

EMAIL=your.email@example.com
PASSWORD=your_password
COUNTRY_CODE=br
SCHEDULE_ID=70249960
FACILITY_ID=56
FACILITY_ID_ASC=60
REFRESH_DELAY=3

Usage
node index.js -c <current_date> [-t <target_date>] [-m <min_date>]
