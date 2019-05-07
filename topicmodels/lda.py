"""
MENOME TECHNOLOGIES TOPIC MODELER.

Run this and put your text on stdin. It will output a JSON representation of associated topics.
Run this with -l to instead list topics as JSON.
"""
import os
import sys
import json
import argparse

##for topic modeler
from gensim import corpora, models, similarities, parsing

class TopicModeler():
    def __init__(self):
        self.dictionary = corpora.Dictionary.load_from_text(os.environ.get("DICT_ADDRESS","../config/vocab.dict"))
        self.lda = models.LdaModel.load(os.environ.get("LDA_MODEL_ADDRESS","../config/model.lda"))

    def getTopics(self):
        topics = self.lda.show_topics(num_topics=-1, num_words=15, log=False, formatted=False)
        #topics = self.lda.get_topics()
        #print(topics)
        json_topics = {}
        for _,(id,wordlist) in enumerate(topics):
            json_wordlist = {}
            for _,(name,weight) in enumerate(wordlist):
                json_wordlist[name] = str(weight)
            json_topics[id] = json_wordlist
        return json.dumps(json_topics)
      
    def modelText(self,text):
        #Now we neeed to perform pre-processing on the fulltext from the node
        #That is to say. Lowercased and stemmed and stopworded
        doc = parsing.preprocessing.preprocess_string(text)

        # Then turn it into a bow
        vec_bow = corpora.Dictionary.doc2bow(self.dictionary, doc)

        #model that shiet with that lda bitch
        doc_topics = sorted(self.lda[vec_bow],key=lambda x: x[1],reverse=True)

        json_topics = {}
        for _,topic in enumerate(doc_topics):
            json_topics[topic[0]] = topic[1]

        return json.dumps(json_topics)
      
## Entrypoint
def main():
    parser = argparse.ArgumentParser(description='Menome Technologies Topic Modeler')
    parser.add_argument("--list","-l", action="count", help="List topics as JSON and exit.")
    parser.add_argument("input", help="File to model. Must be a plaintext file, or - to use stdin.")
    args = parser.parse_args()

    try:
        tm = TopicModeler()
        if args.list:
            print tm.getTopics()
        elif args.input == '-':
            print tm.modelText(sys.stdin.read())
        else:
            with open(args.input) as data:
                    print tm.modelText(data.read())      
    except Exception as ex:
        print(ex)
        exit(1)

if __name__ == '__main__':
    main()
