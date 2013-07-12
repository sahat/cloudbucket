import requests, json
import nltk
from nltk import FreqDist, WordPunctTokenizer
from nltk.corpus import stopwords
from nltk.collocations import BigramCollocationFinder,TrigramCollocationFinder
from nltk.metrics import BigramAssocMeasures,TrigramAssocMeasures
from nltk.chunk import RegexpParser
import csv
from pprint import pprint
from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/extract', methods=['POST'])
def extract_keywords():
    print(request.form)
    filepath = request.form['path']
    extension = request.form['extension']

    if extension is not 'txt':
        return json.dumps({'tags': 'invalid format'})

    url = 'https://s3.amazonaws.com/semanticweb/'
    text = requests.get(url+filepath).text

    bigramList = []
    trigramList = []
    wordList = []
    nouns = []
    words = WordPunctTokenizer().tokenize(text)
    pos = nltk.pos_tag(words)
    for i in range(len(pos)):
        if len(pos[i][0]) > 1:
            if pos[i][1] == 'NN' or pos[i][1] == 'NNP':
                nouns.append(pos[i][0])
    newString = ' '.join(nouns).lower()


    tag_count = 50
    wordList=[]
    stopset = set(stopwords.words('english'))
    words = WordPunctTokenizer().tokenize(newString)
    wordsCleaned = [word.lower() for word in words if word.lower() not in stopset and len(word) > 2 ]
    fdist = FreqDist(wordsCleaned).keys()
    if len(wordsCleaned) < tag_count:
        tag_count = len(wordsCleaned)-1
    if tag_count > 0:
        for j in range(1,tag_count):
            word = fdist[j-1:j]
            if len(word) > 0:
                wordList.append(word[0])

    return json.dumps({'tags': wordList})

if __name__ == '__main__':
    app.run(debug=True)
