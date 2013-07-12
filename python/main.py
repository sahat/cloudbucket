import requests, json, os
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

@app.route('/')
def home():
    return 'Pass a filename as URL parameter'

@app.route('/<file>')
def extract_keywords(file):
    name, extension = os.path.splitext(file)

    if extension == '.txt':
        print('https://s3.amazonaws.com/semanticweb/' + file)
        response = requests.get('https://s3.amazonaws.com/semanticweb/' + file)

        nouns = []
        words = WordPunctTokenizer().tokenize(response.text)
        pos = nltk.pos_tag(words)

        for i in range(len(pos)):
            if len(pos[i][0]) > 1:
                if pos[i][1] == 'NN' or pos[i][1] == 'NNP':
                    nouns.append(pos[i][0])
        newString = ' '.join(nouns).lower()


        tag_count = 10
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
    else:
        json.dumps({'message': 'Unsupported File Format'})

if __name__ == '__main__':
    app.run(debug=True)
