# coding: utf-8

import requests
import re
from bs4 import BeautifulSoup
import math
import itertools
from collections import defaultdict
import pickle

#Use beautifulsoup package to extract index html

index = requests.get("http://www.j-archive.com/listseasons.php")
soup = BeautifulSoup(index.text, 'html.parser')

season_urls = ['http://www.j-archive.com/' + anchor['href'] for anchor in soup.find(id='content').find_all('a')]

#Soupify html of each individual season

seasoned_soup = [BeautifulSoup(requests.get(season).text, 'html.parser') for season in season_urls]

season_anchors = [season.find(id='content')
                  .find_all(lambda tag: (tag.name == 'a') and (tag.parent.name != 'p')) 
                  for season in seasoned_soup]

season_names = [url.split('season=')[1] for url in season_urls]

#Get episode URL list
ep_urls = [[anchor['href'] for anchor in season] for season in season_anchors]

ep_urls = [list(itertools.compress(season, ['http://www.j-archive.com/showgame.php?game_id=' 
                                            in ep for ep in season])) for season in ep_urls]

season_dict = {ep: season_names[i] for i,ep_season in enumerate(ep_urls) for ep in ep_season}

def flatten(_list):
    return list(itertools.chain.from_iterable(_list))

flattened_ep_urls = flatten(ep_urls)

with open('preprocessing.pkl', 'wb') as savefile:
    pickle.dump([flattened_ep_urls, season_dict], savefile)