# coding: utf-8

import requests
import re
from bs4 import BeautifulSoup
import math
import itertools
from collections import defaultdict
import pickle
from preprocessing import flatten
import time
import os
import sys
from typing import List, Dict, Any

with open('preprocessing.pkl', 'rb') as savefile:
    prep_vars = pickle.load(savefile)
    
flattened_ep_urls = prep_vars[0]
season_dict = prep_vars[1]

def get_episode_info(url):
    soup = BeautifulSoup(requests.get(url).text, 'html.parser')
    title_string = soup.find(id='game_title').text
    show_num = re.search('#(\d+)', title_string).group(1)
    date = re.search('- (.+)', title_string).group(1)
    comments = soup.find(id='game_comments').text.replace('\n', '').replace('\r', '')
    return [show_num,date,comments]

def get_contestant_info(url = None, soup = None):
    if soup is None:
        if url is None:
            raise ValueError('Needs one of the two arguments')
        else:
            soup = BeautifulSoup(requests.get(url).text, 'html.parser')
                
    contestant_name_re = re.compile('([^,]+),')
    contestant_job_re = re.compile(', (?:a|an|the) (.*?) (?:originally|from)')
    contestant_location_re = re.compile('from ([^\(]+)')
    
    contestant_list = soup.find_all('p', class_='contestants')
    
    contestant_name = [contestant_name_re.search(contestant.text).group(1)
                       if contestant_name_re.search(contestant.text) else ''
                       for contestant in contestant_list]
    
    contestant_job = [contestant_job_re.search(contestant.text).group(1)
                      if contestant_job_re.search(contestant.text) else ''
                      for contestant in contestant_list]
    
    contestant_location = [contestant_location_re.search(contestant.text).group(1) 
                           if contestant_location_re.search(contestant.text) else ''
                           for contestant in contestant_list]
    
    contestants = list(zip(contestant_name, contestant_job, contestant_location))
    
    return get_episode_info(url) + list(itertools.chain.from_iterable([list(contestant) for contestant in contestants] \
                                                                      + [['','','']]*(4-len(contestants))))

value_sign_dict = {'neither': 0, 'right': 1, 'wrong': -1}

def get_clue_order(order_list):
    clue_order = []
    total = 0
    for i, _round in enumerate(order_list):
        if i==0:
            clue_order.extend(_round)
        else:
            clue_order.extend([total + clue for clue in _round])
        total += len(_round)
    return clue_order

def get_question_info(url: str) -> List[Dict[str, Any]]:
    
    """Take in an episode and return a list of each question and its relevant information"""
    
    soup = BeautifulSoup(requests.get(url).text, 'html.parser')
    
    ep_id = int(re.findall('#(.*),', soup.title.text)[0])
          
    rounds = soup.find_all(id=re.compile('jeopardy_round|double_jeopardy_round|final_jeopardy_round'))
    
    if len(rounds)==0:
        return []
    
    category_list = {_round['id']: [category.text for category in _round.find_all('td', class_='category_name')] 
                     for _round in rounds}
    
    round_clue_orders = [[int(clue.find('td', class_='clue_order_number').text) - 1 
                          if clue.find('td', class_='clue_order_number') else i
                          for i, clue in enumerate(clue_sect.find_all('div'))]
                         for clue_sect in rounds]
    
    clue_order = [[index[0] for index in sorted(enumerate(_round), key=lambda x: x[1])] 
                  for _round in round_clue_orders]
    
    order_iter = itertools.chain.from_iterable(clue_order)
    
    clue_chunks = [list(zip(_round.find_all('div'), 
                            [clue.text for clue in _round.find_all('td', class_='clue_text')])) 
                   for _round in rounds]
        
    clue_chunks = [clue_set[next(order_iter)] for clue_set in clue_chunks
                   for _,_ in enumerate(clue_set)]
    
    #had to re-soupify the div tags to get unicode out of quotes. If I learn a better way to do this I'll change it
    div_tag_soup = [BeautifulSoup(clue[0]['onmouseover'], 'html.parser') 
                   for clue in clue_chunks]
    
    clue_rounds = [clue[0].find_parent('div')['id'] for clue in clue_chunks]
    
    is_fj = [_round=='final_jeopardy_round' for _round in clue_rounds]
    
    contestants = itertools.chain.from_iterable([div.find_all('td', class_=re.compile('wrong|right')) 
                                                        for div in div_tag_soup])
    
    contestants = list(set([answerer.text for answerer in contestants 
                            if ('Triple Stumper' not in answerer.text) & ('Quadruple Stumper' not in answerer.text)]))
    
    #A dictionary describing who answered each question and if they were right or wrong
    answerer_dicts =     [defaultdict(lambda: 'neither', [[contestant.text, contestant['class'][0]] 
                                     for contestant in div.find_all('td', class_=re.compile('wrong|right')) 
                                     if 'Triple Stumper' not in contestant.text]) for div in div_tag_soup]
    
    value_tags = [clue[0].find('td', class_=lambda text: 'clue_value' in text).text 
                  for i, clue in enumerate(clue_chunks)
                  if not is_fj[i]]
    
    #clue_values = [int(value.split('$')[1].replace(',', '')) for value in value_tags]
    clue_values = [int(re.compile('[^\d,](?=\d)').split(value)[-1].replace(',', '')) for value in value_tags]
    
    fj_index = [i for i,_ in enumerate(clue_chunks) if is_fj[i]]
    
    fj_values = []
        
    fj_contestants = []
    
    if len(fj_index)>0:
        
        fj_values = [[int(value.replace(',', '').replace('$', '').split('.')[0])] + [0]*(len(fj_index)-1)
                     for value in div_tag_soup[fj_index[0]].find_all(string=re.compile('^[\$\d][\d,]+$'))]
        
        fj_contestants = [contestant.text 
                          for contestant in div_tag_soup[fj_index[0]].find_all('td', class_=re.compile('wrong|right'))]
        
    fj_dict = dict(zip(fj_contestants, fj_values))
        
    contestant_value_dict = {contestant: (clue_values + fj_dict[contestant]
                                          if fj_dict.get(contestant) is not None else 
                                          (clue_values + [0] if len(fj_dict) > 0 else clue_values)) 
                             for contestant in contestants}    
    
    contestant_score_dict = {contestant: [value*value_sign_dict[answerer_dicts[i][contestant]] 
                                          for i,value in enumerate(contestant_value_dict[contestant])] 
                             for contestant in contestants}
    
    contestant_scores = [flatten([[contestant, contestant_score_dict[contestant][i]]
                                                             for contestant in contestant_score_dict])
                         for i,_ in enumerate(contestant_score_dict[contestants[0]])]
    
    if len(contestant_scores[0]) < 8:
        
        contestant_scores = [clue + ['']*(8 - len(clue)) for clue in contestant_scores]
        
    score_keys = []
    
    for i in range(4):
        
        score_keys.append('contestant_{}'.format(i+1))
        score_keys.append('c{}_score_update'.format(i+1))
        
    difficulty = [int(clue[0].find('td', class_='clue_unstuck')['id'].split('_')[-2])
                       if clue[0].find('td', class_='clue_unstuck') is not None else 0 
                       for clue in clue_chunks]
        
    clue_columns = [int(clue[0].find('td', class_='clue_unstuck')['id'].split('_')[-3]) - 1
                       if clue[0].find('td', class_='clue_unstuck') is not None else 0 
                       for clue in clue_chunks]
    
    clue_cats = [category_list[_round][clue_columns[i]] for i, _round in enumerate(clue_rounds)]
    
    season = season_dict[url]
        
    questions = [clue[1] for clue in clue_chunks]

    answers = [clue.find('em', class_=lambda text: 'correct_response' in text).text for clue in div_tag_soup]
    
    daily_double = ['DD' in value if not is_fj[i] else False for i,value in enumerate(value_tags)] + ['False']*len(fj_index)
    
    clues = [dict(**{'season': season,
                     'ep_id': ep_id, 
                     'question_id': i+1, 
                     'round': clue_rounds[i], 
                     'category': clue_cats[i],
                     'difficulty': difficulty[i],
                     'question': questions[i], 
                     'answer': answers[i], 
                     'DD': daily_double[i]},
                  **dict(zip(score_keys, contestant_scores[i]))
                 )
             for i,_ in enumerate(clue_chunks)]
    
    return clues

def sectioner(num, sections):
    if sections > num:
        raise ValueError('Number of sections needs to be smaller than the number')
    increment = num/sections
    _list = [increment]
    for i in range(sections-2):
        _list.append(_list[-1]+increment)
    if sections > 1:
        _list.append(num)
    return [round(x) for x in _list]

def if_else(cond, if_, else_):
    if cond:
        return if_
    else:
        return else_

def get_all_info(func, urls, error_list, load_inc = 100):
    if len(urls) == 0:
        yield
    load_inc = if_else(len(urls)>=load_inc, load_inc, len(urls))
    increments = sectioner(len(urls), load_inc)
    i = 0
    for url in urls:
        if i in increments:
            print("{}% done".format((i/len(urls))*100))
        time.sleep(5.0)
        try:
            yield func(url)
        except:
            print('Cannot retrieve episode {} \n'.format(url))
            error_list.append(url)
        i+=1

def a_or_w(filename):
    if os.path.exists(filename):
        return 'a' # append if already exists
    else:
        return 'w' # make a new file if not

if __name__== "__main__":
    
    which_extract = 'both'
    which_ep_list = 'default'
    if len(sys.argv) > 1:
        which_extract = sys.argv[1]
    if len(sys.argv) > 2:
        which_ep_list = sys.argv[2]
        
    q_urls, c_urls = flattened_ep_urls.copy(), flattened_ep_urls.copy()
    
    if which_ep_list.lower() == 'default':  
        
        try:
            with open('error_lists.pkl', 'rb') as error_lists:
                q_urls = pickle.load(error_lists)
                c_urls = pickle.load(error_lists)
        except:
            pass
                
    question_errors = []
    contestant_errors = []

    all_questions = get_all_info(get_question_info, q_urls, question_errors)
    all_contestants = get_all_info(get_contestant_info, c_urls, contestant_errors)
    
    #--Extract question information--
    
    if (which_extract.lower() == 'both') or (which_extract.lower() == 'questions'):
        
        with open('jeopardy_questions.txt', a_or_w('jeopardy_questions.txt')) as f:
            
            for episode in all_questions:
                if episode is None:
                    break
                if len(episode) > 0:
                    for question in episode:
                        f.write('||'.join(map(str, question.values())))
                        f.write("\n")
                        
    else:
        
        try:
            with open('error_lists.pkl', 'rb') as error_lists:
                question_errors = pickle.load(error_lists)
        except:
            pass
    
    #--Extract contestant information--
    
    if (which_extract.lower() == 'both') or (which_extract.lower() == 'contestants'):
    
        with open('contestants.txt', a_or_w('contestants.txt')) as f:
        
            for episode in all_contestants:
                if episode is None:
                    break
                if len(episode) > 0:
                        f.write('||'.join(map(str, episode)))
                        f.write("\n")
                        
    else:
        
        try:
            with open('error_lists.pkl', 'rb') as error_lists:
                pickle.load(error_lists)
                contestant_errors = pickle.load(error_lists)
        except:
            pass
                    
    with open('error_lists.pkl', 'wb') as error_lists:
        pickle.dump(question_errors, error_lists)
        pickle.dump(contestant_errors, error_lists)