import datetime
import uuid
import os
import unicodedata
from collections import defaultdict
import json
import argparse
from stop_words import get_stop_words
##for topic modeler
from gensim import corpora, models, similarities, parsing
##for graph database access
from neo4j import GraphDatabase


def getNodeFulltext(tx, uuid):
    return tx.run("MATCH (f {Uuid:{key}}) WHERE f.FullText <> '' RETURN f.FullText",{"key":uuid}).single().values()

def getUuids(tx):
    return list(tx.run("MATCH (f) where f.FullText <> '' return f.Uuid").value())

class TopicModeler():
    def __init__(self):
        ##Configuration file address, for dockerized run
        self.CONFIG_ADDRESS = os.environ.get("CONFIG_ADDRESS","../config/config.json")




    def generateModel(self, numTopics, numPasses, updateAfter, destination):
        with open(self.CONFIG_ADDRESS) as cfg:
            data = json.load(cfg)

            # Load DB info. Let os environment variables override this.
            uri = os.environ.get("NEO4J_URL",data['neo4j']['url'])
            user = os.environ.get("NEO4J_USER",data['neo4j']["user"])
            password = os.environ.get("NEO4J_PASS",data['neo4j']["pass"])
            stoplist =get_stop_words('english')

            print("Generating model from database: " + uri)
            #now we need to connect to the database instance so we can add our models to the graph
            driver = GraphDatabase.driver(uri, auth=(user,password),encrypted=False)
            session = driver.session()

            print("Getting Uuids")
            ##now we want to pull our list of uuids for data to model
            uuids = session.read_transaction(lambda tx: getUuids(tx))
            #uuids = uuids[0:5]

            #now we load the fulltexts so we can start to build a dictionary
            tokensArray = []
            for i,uuid in enumerate(uuids):
                print("Pulling record: " + str(i))
                try:
                    fulltext = parsing.preprocessing.preprocess_string(session.read_transaction(lambda tx: getNodeFulltext(tx, uuid))[0])
                except:
                    print("Fulltext for document missing, skipping document.")
                    continue

                #now we need to tokenize our documents
                frequency = defaultdict(int)
                for token in fulltext:
                    frequency[token] += 1
                tokens = [token for token in fulltext if frequency[token] > 1] 
                tokensArray.append(tokens)

            ##set up a location to save the model to
            save_location = os.environ.get("MODEL_DIR",data['topicmodels']['modledir']) + destination + '/'
            try:
                os.makedirs(save_location)
            except:
                #print("directory exists, continuing.")
                pass


            #now we need to create and save our dictionary
            dictionary = corpora.Dictionary(tokensArray)
            dictionary.save_as_text(save_location + "vocab.dict")
            #now we need to build and save our vector corpus for training
            corpus = [dictionary.doc2bow(text) for text in tokensArray]
            corpora.MmCorpus.serialize((save_location + "corpus.mm"), corpus)

            #now we train our model on the documents and save it
            lda = models.ldamodel.LdaModel(corpus, id2word=dictionary, num_topics=numTopics, update_every=updateAfter, passes=numPasses)
            lda.save((save_location + "model.lda"))
            
            ##send them new topics back as getTopics would
            topics = lda.show_topics(num_topics=-1, num_words=15, log=False, formatted=False)
            json_topics = {}
            for _,(id,wordlist) in enumerate(topics):
                json_wordlist = {}
                for _,(name,weight) in enumerate(wordlist):
                    json_wordlist[name] = str(weight)
                json_topics[id] = json_wordlist
            return json.dumps(json_topics)


## Entrypoint
def main():
    parser = argparse.ArgumentParser(description='Menome Technologies Topic Model Generator')
    parser.add_argument("numTopics", type=int)
    parser.add_argument("numPasses", type=int)
    parser.add_argument("updateAfter", type=int)
    parser.add_argument("destination", type=str)

    args = parser.parse_args()
    #print(args.numPasses)

    try:
        tm = TopicModeler()
        print (tm.generateModel(args.numTopics, args.numPasses, args.updateAfter, args.destination))  
    except Exception as ex:
        print("Caught Exception")
        print(ex)
        exit(1)

if __name__ == '__main__':
    main()


