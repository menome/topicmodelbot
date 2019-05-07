# FPP Topic Models Bot

Takes fulltext from files. Runs LDA topic models.

## Set Up

You will need the following tools:

* python2.7
* pip2
* node 10
* npm 6

It is strongly recommended to have `virtualenv` as well unless you want to manage your own python environment. I'm going to be using `virtualenv` and `virtualenvwrapper` for these walkthough

1. Set up node deps: `npm install`
2. Set up your virtualenv `mkvirtualenv menome_py2`
3. Install dependencies `pip install -r requirements.txt`
4. Start the thing `npm run dev`

## Updating Python Dependencies

After installing/testing/running new dependencies, **while in the virtualenv** do:

`pip freeze > requirements.txt` 

### More info

See [this](https://github.com/menome/kents_playground#i-want-to-run-something-on-python)