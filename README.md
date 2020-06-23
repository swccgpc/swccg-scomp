# Scomp Link Access 
Welcome to the Star Wars CCG Card Search website! This repository contains all of the UI for searching and displaying all of the existing SWCCG cards.

For more information about Star Wars CCG, check out the SWCCG Players Committee website here: https://www.starwarsccg.org/


## Where Does Your Data Come From?
The card data comes from the SWCCG-Card-JSON Database here (https://github.com/swccgpc/swccg-card-json/)


## Where Are The Images?
All of the images are hosted in the Holotable Git repository (https://github.com/swccgpc/holotable). This database links directly to those images.


## How Does It Work?
* Javascript + AngularJS
* Website downloads the Dark.json and Light.json card database files
* Inspects the database for all possible values of fields (for auto-complete and dropdowns)
* Searches are 100% client-side.  This is to keep the load off of the PC Server and to also eventually facilitate off-line mode


## Interesting Features
* Dropdowns automatically update when new content is added to the JSON file. No code changes required!
* Optionally supports "text-only" mode so that we can support new cards in the system, even if images aren't ready yet. This also lets you easily copy-paste from the cards


## How Can I Run This Locally?
The website code is flexible enough to run on pretty much any web server.  The easiest way to run this locally is to use Python's SimpleHTTPServer.  It's extremely easy to install. Simply follow the steps here:
https://developer.mozilla.org/en-US/docs/Learn/Common_questions/set_up_a_local_testing_server

After you've followed those instructions:
1) Open a command prompt
2) Navigate to the folder containing this code
3) Type  "python -m SimpleHTTPServer"
4) Open any browser to "localhost:8000/index.html"

Done!  You should be able to play around with the site locally now.


## Where Can I Ask Questions?
The best place to ask questions about this project is on the Star Wars CCG Players Committee Forums. Specifically, the "Resources" Sub-Form: https://forum.starwarsccg.org/viewforum.php?f=188


## How To Contribute?
If you see bugs in the current site, please contribute!  

Here's a brief overview of what you will need to do:
1. Create a Fork of the code
2. Create a new branch inside your fok
3. Commit your changes in that branch
4. Create a pull request (PR)
5. Someone on the team will review your PR and get it merged?

There is a nice tutorial here:
https://www.thinkful.com/learn/github-pull-request-tutorial/Time-to-Submit-Your-First-PR#Time-to-Submit-Your-First-PR


## Bugs In Card JSON Files
For bugs in the Card JSON, please contribute to this repository: https://github.com/swccgpc/swccg-card-json/


## Deploying

* Scomp Link Access is hosted in the S3 bucket: `scomp.starwarsccg.org`.
* Deploying to the S3 bucket is handled by a **GitHub Action** when merging in to the **Master Branch**.
* For _**YOU**_ to deploy, you must:
  1. Create a `pull request` against this repo
  2. Have the pull request merged to `master`.
* Once @DevoKun or @thomasmarlin approve and merge the pull request the GitHub action will automatically deploy the latest code version.


## Attribution
This repository is a fork from here:  
https://github.com/thomasmarlin/scomp-link-access

