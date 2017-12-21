import extraction
import pickle

if __name__=="__main__":
   
    print(extraction.question_errors)
    print(extraction.contestant_errors)
    
    for _ in extraction.all_questions:
        pass
    
    for _ in extraction.all_contestants:
        pass
    
    with open('error_lists.pkl', 'wb') as error_lists:
        pickle.dump(extraction.question_errors, error_lists)
        pickle.dump(extraction.contestant_errors, error_lists)
        