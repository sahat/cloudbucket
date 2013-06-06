import nltk
from nltk import FreqDist, WordPunctTokenizer
from nltk.corpus import stopwords
from nltk.collocations import BigramCollocationFinder,TrigramCollocationFinder
from nltk.metrics import BigramAssocMeasures,TrigramAssocMeasures
from nltk.chunk import RegexpParser
import csv
from pprint import pprint

csvwrite = file('db\cyttron-keywords.csv', 'wb')
bigramList = []
trigramList = []
wordList = []

# Extract wordFreq,bi/tri-grams. Store them in CSV
def extractKeywords(list,nr):
    csv = open('db\cyttron-keywords.csv','a')
    csv.write('"keywords";"keynouns";"bigrams";"trigrams"\n')
    csv.close()
    for i in range(len(list)):
        currentEntry = list[i]
        freqWords(currentEntry,nr)
        freqNouns(currentEntry,nr)
        nGrams(currentEntry,nr,clean=True)
    csv.close()

def descKeywords(list):
    for i in range(len(list)):
        currentEntry = str(list[i][0])
        # print currentEntry
        freqWords(currentEntry,25)
        nGrams(currentEntry)
        print " "

# String-functions
def freqNouns(string,int):
    list=[]
    words = WordPunctTokenizer().tokenize(string)
    pos = nltk.pos_tag(words)
    for i in range(len(pos)):
        if len(pos[i][0]) > 1:
            if pos[i][1] == 'NN' or pos[i][1] == 'NNP':
                list.append(pos[i][0])
    newString = ' '.join(list).lower()
    freqWords(newString,int)

def freqWords(string,int):
    global pub,wordList
    wordList=[]
    stopset = set(stopwords.words('english'))
    words = WordPunctTokenizer().tokenize(string)
    wordsCleaned = [word.lower() for word in words if word.lower() not in stopset and len(word) > 2 ]
    fdist = FreqDist(wordsCleaned).keys()
    if len(wordsCleaned) < int:
        int = len(wordsCleaned)-1
    if int > 0:
        for j in range(1,int):
            word = fdist[j-1:j]
            if len(word) > 0:
                wordList.append(word[0])
    return wordList

def nGrams(string,int,clean=True):
    global wordList
    biList=[]
    triList=[]
    words = WordPunctTokenizer().tokenize(string)
    stopset = set(stopwords.words('english'))
    if clean == True:
        words = [word.lower() for word in words]
    if clean == False:
        words = [word.lower() for word in words]
    filter = lambda words: len(words) < 2 or words.isdigit()
    
    bcf = BigramCollocationFinder.from_words(words)
    bcf.apply_word_filter(filter)
    biResult = bcf.nbest(BigramAssocMeasures.likelihood_ratio, int)

    tcf = TrigramCollocationFinder.from_words(words)
    tcf.apply_word_filter(filter)
    triResult = tcf.nbest(TrigramAssocMeasures.likelihood_ratio, int)

    for i in range(len(biResult)):
        if len(biResult) > 0:
            biPrint = " ".join(biResult[i])
            biList.append(biPrint)
        else:
            biList=[]
    csv = open('db\cyttron-keywords.csv','a')            
    if len(biList) > 1:
        csv.write('"' + ', '.join(biList[:-1]) + ', ' + biList[-1] + '";')
    else:
        csv.write('"' + ''.join(biList) + '";')
    csv.close()
    
    for i in range(len(triResult)):
        if len(triResult) > 0:
            triPrint = " ".join(triResult[i])
            triList.append(triPrint)
        else:
            triList=[]
    csv = open('db\cyttron-keywords.csv','a')
    if len(triList) > 1:
        csv.write('"' + ', '.join(triList[:-1]) + ', ' + triList[-1] + '"\n')
    else:
        csv.write('"' + ''.join(triList) + '"\n')
    csv.close()
