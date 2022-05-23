Scomp Link Access
=================


Welcome to the Star Wars CCG Card Search website! This repository contains all of the UI for searching and displaying all of the existing SWCCG cards.

For more information about Star Wars CCG, check out the SWCCG Players Committee website here: https://www.starwarsccg.org/


## Passing search terms via the URL

* A search string can be passed by the URL using the `?s=` search parameter.
* For example: `https://scomp.starwarsccg.org/?s=Sandcrawler`


## Where Does The Data Come From?
* The card data comes from the [SWCCG-Card-JSON Database](https://github.com/swccgpc/swccg-card-json/)


## Where Are The Images?
* All of the images originate in the [Holotable Git repository](https://github.com/swccgpc/holotable).
* The holotable images are hosted on `res.starwarsccg.org`, which `Light.json` and `Dark.json` link to.


## How Does It Work?
* Javascript + AngularJS
* The Website downloads the `Dark.json` and `Light.json` card database files
* Inspects the database for all possible values of fields (for auto-complete and dropdowns)
* Searches are 100% client-side.


## Interesting Features
* Dropdowns automatically update when new content is added to the JSON file. No code changes required!
* Optionally supports "text-only" mode so that we can support new cards in the system, even if images aren't ready yet. This also lets you easily copy-paste from the cards



## How To Contribute?
* If you see bugs in the current site, please create an issue on GitHub or create a Pull request.

### Contributing Code:
1. Create a Fork of the code
2. Create a new branch inside The fok
3. Commit The changes in that branch
4. Create a pull request
5. Someone on the team will review the pull request and merge it.

### Contributing code using git

Anyone may contribute to this project!

We use GIT to manage our source code repository. If you are not familiar with GIT,
think of it like this:  If you want to submit a change, you'll need to make a "Pull Request".
 
1.  You make a branch of the code for yourself
2.  You make changes
3.  You submit your branch of code
4.  You create a Pull Request which means "you want the SWCCG community to pull in your changes"
5.  We review your changes, and merge your branch into the main branch

Here is a nice tutorial which details the steps for creating a Pull Request
https://www.thinkful.com/learn/github-pull-request-tutorial/Time-to-Submit-Your-First-PR#Time-to-Submit-Your-First-PR

### Run a simple webserver locally using Python3

The website code can be run from any static website hosting platform, including apache2, nginx, s3, or python's built-in http server.

The easiest way to run this locally is to use Python's built-in http server module. 

1. Open a command prompt
2. Navigate to the folder containing this code
3. Start the HTTP server with the command: `python3 -m http.server`
4. Open any browser to "localhost:8000/index.html"

Done! You should be able to play around with the site locally now.



## Bugs In Card JSON Files
* [For bugs in the Card JSON, please contribute to the swccg-card-json repository](https://github.com/swccgpc/swccg-card-json/)


## Deploying

* Scomp Link Access is hosted in the S3 bucket: `scomp.starwarsccg.org`.
* Deploying to the S3 bucket is handled by a **GitHub Action** when merging in to the **Main Branch**.
* For _**YOU**_ to deploy, you must:
  1. Create a `pull request` against this repo
  2. Have the pull request merged to `main`.
* Once @DevoKun or @thomasmarlin approve and merge the pull request the GitHub action will automatically deploy the latest code version.


## Attribution
* [Scomp was originally created by Thomas Marlin](https://github.com/thomasmarlin)

