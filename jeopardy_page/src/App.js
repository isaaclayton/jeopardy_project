import React, {
    Component
} from 'react';
import './App.css';
import {
    csv
} from 'd3-request';
import WordFreq from './WordFreq';
import USMap from './USMap';

class App extends Component {
    constructor(props) {
        super(props);
        this.onResize = this.onResize.bind(this);
        this.state = {clue_words: [], state_winnings:[], screenWidth: 1000, screenHeight: 500}
    }
    componentWillMount() {
        
        let clue_csv = require('./data_files/clue_word_list.csv');
       
        csv(clue_csv, (error, data) => {
            if(error) {
                this.setState({loadError: true});
            }
            for (let key in data) {
                for (let i=1; i<35; i++) {
                    data[key]['season'+i] = +data[key]['season'+i]
                    data[key][`season${i}_total`] = +data[key][`season${i}_total`]
            }
            }

            this.setState({
                clue_words: data
            })
        })
        
        let winnings_csv = require('./data_files/state_win_rates.csv');
        let statelines_json = require('./data_files/statelines.json');
        
        csv(winnings_csv, data =>
                this.setState({state_winnings: join(data, statelines_json.features, 'state', 'NAME', 
                    function(state, winnings) {
                        let property = Object.assign({}, state.properties);
                        property.rate = (winnings !== undefined) ? winnings.rate : 0;
                        property.streak = (winnings !== undefined) ? winnings.streak : 0;
                        property.longitude = (winnings !== undefined) ? winnings.longitude : 0;
                        property.latitude = (winnings !== undefined) ? winnings.latitude : 0;
                        return {
                            type: state.type,
                            geometry: state.geometry,
                            properties: property
                        };
                }
                )}));
        
            function join(winnings, state, winningsKey, stateKey, select) {
                
            const win_len = winnings.length;
            const state_len = state.length;
            let lookupIndex = [];
            let output = [];
            for (let i = 0; i < win_len; i++) {
                let row = winnings[i];
                lookupIndex[row[winningsKey]] = row;
            }
            for (let j = 0; j < state_len; j++) {
                let y = state[j];
                let x = lookupIndex[y.properties[stateKey]];
                output.push(select(y, x))
            }
            return output;
        }
        
    }
    
    componentDidMount() {
        window.addEventListener('resize', this.onResize, false)
        this.onResize()
    }
    
    onResize() {
        this.setState({ screenWidth: window.innerWidth,
                      screenHeight: window.innerHeight - 70})
    }
    render() {
    /*if (this.state.loadError) {
      <div>couldn't load file</div>
    }
    if (!this.state.clue_words) {
      <div/>
    }*/
    let clue_words = [];
    const numWords = 6
    if (this.state.clue_words.length >0) {
    for (let j=0; j<numWords; j++) {
        let arr = []
            for (let i=1; i<35; i++) {
        arr.push({season: i, word_count: this.state.clue_words[j]['season'+i], season_count: this.state.clue_words[j][`season${i}_total`], ratio: this.state.clue_words[j]['season'+i]/this.state.clue_words[j][`season${i}_total`],
                 name: this.state.clue_words[j]['word']});
    }
    clue_words.push(<WordFreq key={j} margins={[50,60]} data={arr} size={[250,250]}/>)
    }
}
        return (
            <div id = 'wrapper'>
                <link href = "https://fonts.googleapis.com/css?family=PT+Sans" rel = "stylesheet" />
                <div id = 'header_wrapper'>
                <header id = "App-header">
                <h1> THIS 34 YEAR OLD TELEVISION SERIES IS KNOWN AS "AMERICA'S FAVORITE QUIZ SHOW" </h1>
                </header> 
                </div>
                <div id ='bodyWrapper'>
                        <p> &emsp; If you guessed "Are You Smarter Than a Fifth Grader", hosted by Jeff Foxworthy, <a href='http://www.jefffoxworthy.com/jokes'>you might be a redneck</a>, but you also might want to reconsider your answer. The correct answer is... </p>
                        <div className='title'>
                        <div className='jeopardy-word'> Jeopardy!</div>
                            <p>An analysis of the gameshow<br/> by Isaac Layton</p>
                        </div>
                    <p> &emsp; Jeopardy was a daily ritual in my family. We would gather around the TV and shout "Daily Double!", join Alex Trebek in thanking <a href='https://en.wikipedia.org/wiki/Johnny_Gilbert'>Johnny</a>, and make up rules like "Don't say the answer until the clue is fully read" (my brother and I were quick readers). </p>
                    <p> &emsp; Since getting into data science, I've been curious about what kind of insights I could make about the show. Do some states' contestants win more often? Have certain words become more popular in questions? Which categories are the hardest and easiest?  With this project, I sought to resolve those curiosities.</p>
                    <h2> Finding a Data Source </h2>
                    <p> &emsp; I began my journey by surfing the web to see if anyone had already collected the data. I came across a dataset that a Reddit user made that looked promising, but it had no information on the contestants. I wanted to know where people were from, where they worked, and how well they did on each question. To get this information and to have information on episodes that were aired after this dataset was created, I decided that I would extract the data on my own. Thankfully, the website <a href='http://www.j-archive.com'>j-archive.com</a> has a well kept history of every episode since the 1970s. Each episode has its own page with questions, answers, and contestant information, including who answered each question right and wrong. <a href='http://www.j-archive.com/showgame.php?game_id=4591'> Here's an example.</a> </p>
                    <h2>Extracting the Data</h2>
                    <p> &emsp; I had some familiarity with the Python web parsing library <a href='https://www.crummy.com/software/BeautifulSoup/'>BeautifulSoup</a>, so I used it to parse through each season's directory page. This resulted in a list of episode URLs. Since there are more than 5,000 episodes of Jeopardy, I wasn't able to extract all of their HTML at once. I had to process one episode at a time and write them into a CSV file. From there, I had the flexibility to load it into Pandas or use another programming language like R or SQL. I needed a way to take in an episode's HTML, retrieve the relevant bits of information, and output it in a structured way. At the time I started this project, I was going through a <a href='https://www.regular-expressions.info/'>regular expression</a> phase and had confidence that using them excessively could accomplish all of the information retrieval I needed. I ended up with a somewhat working function, but it looked messy and complicated. Regular expressions are powerful, but they can make code unreadable and aren't always the best way to solve a problem. My function would gather about 95% of the questions without problem, but only as long as they fit exactly into the pattern prescribed by the regular expressions.</p>
                    <p> &emsp; I ended up doing a complete overhaul of the function, choosing instead to read up on how BeautifulSoup could accomplish the task. BeautifulSoup utilizes the page's DOM (<a href='https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction'>Document Object Model</a>) in a way that made searching for information much easier. I could search for the tags and partition the HTML in a way that felt more intuitive. The revised function ended up having less lines of code, was more readable (I still have some work to do on that aspect), and was about 2.4 times faster than the original function that used regular expressions.
                    </p>
                    <p> &emsp; Once the episode extraction function was complete, I made a generator function that would give one URL at a time to my extracting function and then output the questions into a text file. To deal with errors, I originally had the function print out every URL that didn't read correctly. It took about 5 hours to collect every question though (I had to leave 5 seconds between each collection or else the site server would reject my requests), so I would often run it overnight. If I left the error collection as it was, there were 2 problems I ran into:</p>
                    <ol>
                        <li>If I needed to exit the program or close the Jupyter Notebook, it wouldn't save the printed output. I would have no way of knowing which URLs didn't work.</li>
                        <li>If I ended up just leaving the computer open and running, I would have a printed list of the URLS, but it would be hard to manipulate them or troubleshoot the error.</li>
                    </ol>
                    <p>The first problem could've been solved by running the function in my AWS server using a <a href='https://www.rackaid.com/blog/linux-screen-tutorial-and-how-to/'>Linux screen</a>, but that would've still left the second problem. I ended up appending each error URL to a list variable so that I could diagnose the problems easier. This error list was then <a href='https://wiki.python.org/moin/UsingPickle'>pickled</a> to ensure that I could reference it once the function finished. Once the errors in the extraction function were fixed, all I had to do was run the generator function on the error list instead of the complete episode list. This worked by making the list smaller and smaller until I had collected all episodes.
                    </p>
                    <h2>Data Exploration</h2>
                    <p> &emsp; Once the data was gathered, it was time to start answering some questions:</p>
                    <div className='question'>
                        <h3><i>Do some states' contestants win more often?</i></h3>
                        <p> &emsp; To answer this question, there were two facets I decided to inspect: the state's "rate" of winning and the average winning streak. For the rate of winning, I made the choice to look at the rate in which a state's contestant won at least one game. Since I also looked at average streak, this seemed like a good way to make sure that one contestant from a state didn't inaccurately drive up the winning rate. Before doing this, Utah blew every state out of the water. This was due to Ken Jennings, the Jeopardy contestant with the highest winning streak of 74 games, being from Salt Lake City. After adjusting for this, I also weighted the rates based on games with a state being represented by more than one contestant. As you can see below, it appears that Iowa, Arkansas, and West Virginia have the highest percentage of contestants winning at least one game. </p>
                        <div className='graphics'>
                            <h3>Map of State Winning Rates</h3>
                            <div id = 'map'>
                            <USMap data={this.state.state_winnings} size={[this.state.screenWidth/2,this.state.screenHeight/1.5]} x={'rate'} text={'Map of State Winning Rates'}/>
                            </div>
                        </div>
                        <p> &emsp; The average streak was a little more straightforward. The only tweaking that needed to be done was that I had to remove special games, such as Kid's Week and Tournament of Champions, to ensure the correct streaks were recorded. It comes as no surprise to see that Utah is the highest. The average streak for them was 11.27 days. The next best were Missouri with an average streak of 2.27 days, and West Virginia with an average streak of 2.22 days. </p>
                        <div className='graphics'>
                            <h3>Map of State Average Winning Streak</h3>
                            <div id = 'map'>
                            <USMap data={this.state.state_winnings} size={[this.state.screenWidth/2,this.state.screenHeight/1.5]} x={'streak'} text={'Map of State Average Winning Streak'}/>
                            </div>
                        </div>
                        <p>The state that performed highest in both measures combined was West Virginia. They've had several contestants win 4-5 games in a row. The state that appeared to do the worst was South Dakota, with the 20% of contestants who win at least one game only winning that one game. If I decided to include special games though, South Dakota would have included <a href="http://www.j-archive.com/showplayer.php?player_id=1138">Eric Newhouse</a>, who started by winning the 1989 Teen Tournament and ended up being in 5 other Jeopardy tournaments. Good job Eric.</p>
                    </div>
                    <div className='question'>
                        <h3><i>Have certain words become more popular in questions?</i></h3>
                        <p> &emsp; To see if certain words have gotten more or less popular, I gathered all of the questions' text using the Python library <a href="https://www.nltk.org">NLTK (Natural Language ToolKit)</a>. I partitioned the questions into seasons, and looked at the percent of questions in the season the word appeared in. Here are six that I decided to focus on.</p>
                        <div className='graphics'>
                            {clue_words}
                        </div>
                        <p> &emsp; While President Obama got mentioned more when he entered the presidency, President Trump has been popular as a celebrity for quite some time. His name (and uses of the verb trump) was mentioned the most in Season 21, the season directly after the premiere of Trump's popular show <i><a href='https://en.wikipedia.org/wiki/The_Apprentice_(U.S._TV_series)'>The Apprentice</a></i>. His name appeared in 9 questions that season. The word "crew" spiked significantly in 2001, which is when the <a href='https://www.jeopardy.com/about/clue-crew/'>Clue Crew</a> started. Interestingly, the word "one" has more than doubled in frequency since Jeopardy began, usually at the beginning of a question. With "texting" and "internet", their emergence in everyday vocabulary has translated into them being asked about on Jeopardy. </p>
                    </div>
                    <div className='question'>
                        <h3><i>Which categories are the hardest and easiest?</i></h3>
                        <p> &emsp; To find the difficulty of categories, I looked at the total number of questions asked of that category and how many were answered correctly. I'll show some of the questions in these categories below, see if you can answer them!</p>
                        <h4>Hardest Categories:</h4>
                        <p> &emsp; These five categories had all five of their questions picked but not answered correctly.</p>
                        <ol>
                            <li><b><u>C.I.A. DIRECTORS</u></b>: <br/>0/5 questions answered correctly. One of the questions was:
                                <ul>
                                    <li>"An Air Force base on California's Central Coast is named for this general & 1940s C.I.A. director" <br/><span>Answer: <span className='answer'>Hoyt Vandenberg</span></span></li>
                                </ul>
                            </li>
                            <li><b><u>CENTRAL AMERICAN CAPITALS</u></b>: <br/>0/5 questions answered correctly. One of the questions was:
                                <ul>
                                    <li>"Ruins from the Mayan city Kaminaljuyu can be found in this capital but much has been covered by urban expansion" <br/><span>Answer: <span className='answer'>Guatemala City</span></span></li>
                                </ul>
                            </li>
                            <li><b><u>GIVE THE ORDER (given an animal, give the biological order)</u></b>: <br/>0/5 questions answered correctly. One of the questions was:
                                <ul>
                                    <li>"The gorilla" <br/><span>Answer: <span className='answer'>primate</span></span></li>
                                </ul>
                            </li>
                            <li><b><u>QUOTABLE OSCAR HOSTS</u></b>: <br/>0/5 questions answered correctly. One of the questions was:
                                <ul>
                                    <li>"1974: 'Just think, the only laugh that man will probably ever get is for stripping and showing off his shortcomings'"<br/><span>Answer: <span className='answer'>David Niven</span></span></li>
                                </ul>
                            </li>
                            <li><b><u>STAR TREK: VOYAGER</u></b>: <br/>0/5 questions answered correctly. One of the questions was:
                                <ul>
                                    <li>"Voyager in the Delta Quadrant is trying to get back to this quadrant, its home"<br/><span>Answer: <span className='answer'>the Alpha Quadrant</span></span></li>
                                </ul>
                            </li>
                        </ol>
                        <h4>Easiest Categories</h4>
                        <p> &emsp; These four categories had the most questions selected while still having them all be answered correctly.</p>
                        <ol>
                            <li><b><u>TV SPIN-OFFS</u></b>: <br/>40/40 questions answered correctly. One of the questions was:
                                <ul>
                                    <li>"'Croc Files', from this nature show" <br/><span>Answer: <span className='answer'>The Crocodile Hunter</span></span></li>
                                </ul>
                            </li>
                            <li><b><u>LIBROS EN ESPAÑOL</u></b>: <br/>35/35 questions answered correctly. One of the questions was:
                                <ul>
                                    <li>"Rowling:'Harry Potter y la Piedra Filosofal'" <br/><span>Answer: <span className='answer'>Harry Potter and the Sorcerer's Stone</span></span></li>
                                </ul>
                            </li>
                            <li><b><u>NETWORKING (given the show, give the TV network)</u></b>: <br/>35/35 questions answered correctly. One of the questions was:
                                <ul>
                                    <li>"Dinner: Impossible" <br/><span>Answer: <span className='answer'>The Food Network</span></span></li>
                                </ul>
                            </li>
                            <li><b><u>CHINESE HISTORY</u></b>: <br/>32/32 questions answered correctly. One of the questions was:
                                <ul>
                                    <li>"China's Shang Dynasty capital, Anyang, was in the lower valley of this 'colorful' river" <br/><span>Answer: <span className='answer'>yellow</span></span></li>
                                </ul>
                            </li>
                        </ol>
                    </div>
                    <h2>Conclusion</h2>
                    <p> &emsp; Extracting and visualizing Jeopardy has taught me a lot about my favorite gameshow. I never want to stop working on it; I keep wanting to find out more and more interesting insights. Some insights that I plan on adding later on if I have the chance include using natural language processing to cluster categories into broader categories like "History", "Pop Culture", "Science", etc., finding insights into contestant occupation and Jeopardy success, and investigating whether "True Daily Double"s hurt or help a contestant's game. I hope that this analysis has also given you some interesting trivia on a trivia game show. I plan on providing more analyses like this as I continue to grow in my data science abilities. Thanks for reading!</p>
                    
                    <p> This can be found on my GitHub <a href='https://github.com/isaaclayton/jeopardy_project'>here</a>.</p>
                </div> 
            </div>
    );
}
}

export default App;
