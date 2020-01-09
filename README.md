# Sekarion

Sekarion Monitor is a script that checks whether your websites and servers are up and running. It comes with a web based usser interface where you can manage your services and websites.

## Features

* View history graphs of uptime and latency.
* User authentication with 2 levels (administrator and regular user).
* Monitor services :
    - A connection will be established with the IP address or domain entered on the given port. This way, you can check whether certain services on your computer are still running. To check your FTP service for example, enter port 21.

* Monitor ping: 
    - A connection will be established with the IP address or domain entered. 
## Downloads 
   The latest version can be downloaded from https://github.com/sekarion/sekarion/releases.
   
## Requirements

* Node.js >= v10 
* curl for nodejs ```npm i node-libcurl```
* windows builds tools (only for windows)   ```npm install --global windows-build-tools```
* build essentials (only for linux) ```apt-get install build-essential```


 * you can choose to install the database you want among the following:
   * EnMap (not ok for moment )
   * MongoDB (implementer)
   * Mysql (not ok for moment)
   * Rethinkdb (not ok for moment)
   * SQLite3 (not ok for moment )
   
## Install
Copy ``config.json.example`` or rame in `config.json` (in folder `src/config`)

To be able to run an installation from the repo, you need to run the following command to install the dependencies: 
```js
npm i
```
after you need to start the website with : 
```js
node main.js
```

## Licence 
Sekarion Monitor is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

## Authors and helpers 

 * Joris Dugué
  
## Changelogs

* V0.0.1 : 
    - Add Install Sekarion
    - Add components Monitor
    - Edit components Monitor
    - Delete Components Monitor (with confirm message)
    - Add Incidents /resolve 
    - Define the impact have incident 
    - Auto checking the website (loop every 5minutes by default)
    
- V0.0.1RC :
    - Add Ping Monitor
    - Minor bug fixing 

- V0.0.2 :
    - Major bug fix
    - Fix bug with ping service
    - Add new config for user (custom loop for checking website)
- V0.0.3 :
    - Fix bug with timeline (infinity request)
    - Add Timeline in dashboard and home (can select hour, day, weeks or month with ping)
    - Rework UI/UX (not finish with language)
    - Load script with ajax for speed loading page to user
    - Add params methods global formattedDate() for convert date to format Date/Month/Year
    - Remove Material design
    - Add Bootstrap with effect (waves) 
    - Add Jquery and codeflask for (waves and setup)
    - Add Adorable api avatar (remove later maybe)
  