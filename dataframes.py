import pandas as pd
import pickle

contestants = pd.read_csv('contestants.txt', header=None, sep='\|\|', error_bad_lines=True,
                     names = ['show_num','date','comments','c1', 'c1_occ', 'c1_loc', 'c2', 
                              'c2_occ', 'c2_loc', 'c3', 'c3_occ', 'c3_loc', 'c4', 'c4_occ', 'c4_loc'], 
                     engine='python')

reader = pd.read_csv('jeopardy_questions.txt', header=None, sep='\|\|', error_bad_lines=True,
                     names = ['season','show_num','question_num','round', 'category', 'question', 'answer', 
                              'DD', 'c1', 'c1_add', 'c2', 'c2_add', 'c3', 'c3_add', 'c4', 'c4_add'], 
                     engine='python', chunksize = 1000)

episodes = pd.concat([chunk for chunk in reader], ignore_index=True)

store = pd.HDFStore('store.h5')

store['episodes'] = episodes