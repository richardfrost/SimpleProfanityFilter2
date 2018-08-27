import { arrayContains } from './helper.js';

export default class Config {
  advancedDomains: string[];
  censorCharacter: string;
  censorFixedLength: number;
  defaultSubstitutions: string[];
  defaultWordMatchMethod: number;
  defaultWordRepeat: boolean;
  disabledDomains: string[];
  filterMethod: number;
  globalMatchMethod: number;
  password: string;
  preserveCase: boolean;
  preserveFirst: boolean;
  preserveLast: boolean;
  showCounter: boolean;
  substitutionMark: boolean;
  wordList: string[];
  words: {
    [key: string]: {
      matchMethod: number;
      repeat: boolean;
      words: string[];
    }
  };

  static readonly _defaults = {
    advancedDomains: [],
    censorCharacter: '*',
    censorFixedLength: 0,
    defaultSubstitutions: ['censored', 'expletive', 'filtered'],
    defaultWordMatchMethod: 0,
    defaultWordRepeat: false,
    disabledDomains: [],
    filterMethod: 0, // ['Censor', 'Substitute', 'Remove'];
    globalMatchMethod: 3, // ['Exact', 'Partial', 'Whole', 'Per-Word', 'RegExp']
    password: null,
    preserveCase: true,
    preserveFirst: true,
    preserveLast: false,
    showCounter: true,
    substitutionMark: true
  };

  private static readonly _defaultWords = {
    'ass': { matchMethod: 0, repeat: true, words: ['butt', 'tail'] },
    'asses': { matchMethod: 0, repeat: true, words: ['butts'] },
    'asshole': { matchMethod: 1, repeat: true, words: ['butthole', 'jerk'] },
    'bastard': { matchMethod: 1, repeat: true, words: ['imperfect', 'impure'] },
    'bitch': { matchMethod: 1, repeat: true, words: ['jerk'] },
    'cunt': { matchMethod: 1, repeat: true, words: ['explative'] },
    'dammit': { matchMethod: 1, repeat: true, words: ['dangit'] },
    'damn': { matchMethod: 1, repeat: true, words: ['dang', 'darn'] },
    'dumbass': { matchMethod: 0, repeat: true, words: ['idiot'] },
    'fuck': { matchMethod: 1, repeat: true, words: ['freak', 'fudge'] },
    'piss': { matchMethod: 1, repeat: true, words: ['pee'] },
    'pissed': { matchMethod: 0, repeat: true, words: ['ticked'] },
    'slut': { matchMethod: 1, repeat: true, words: ['imperfect', 'impure'] },
    'shit': { matchMethod: 1, repeat: true, words: ['crap', 'crud', 'poop'] },
    'tits': { matchMethod: 1, repeat: true, words: ['explative'] },
    'whore': { matchMethod: 1, repeat: true, words: ['harlot', 'tramp'] }
  };

  static readonly _filterMethodNames = ['Censor', 'Substitute', 'Remove'];
  static readonly _matchMethodNames = ['Exact Match', 'Partial Match', 'Whole Match', 'Per-Word Match', 'Regular Expression'];
  static readonly _maxBytes = 6500;
  static readonly _maxWords = 100;
  static readonly _wordsPattern = /^_words\d+/;

  addWord(str: string) {
    if (!arrayContains(Object.keys(this.words), str)) {
      this.words[str] = {matchMethod: this.defaultWordMatchMethod, repeat: this.defaultWordRepeat, words: []};
      return true;
    }
    return false;
  }

  static async build(keys?: string[]) {
    let async_result = await Config.getConfig(keys);
    let instance = new Config(async_result);
    return instance;
  }

  // Compile words
  static combineWords(items) {
    items.words = {};
    if (items._words0 !== undefined) {
      // Find all _words* to combine
      let wordKeys = Object.keys(items).filter(function(key) {
        return Config._wordsPattern.test(key);
      });

      // Add all _words* to words and remove _words*
      wordKeys.forEach(function(key) {
        Object.assign(items.words, items[key]);
        delete items[key];
      });
    }
    // console.log('combineWords', items); // DEBUG
  }

  // Call build() to create a new instance
  constructor(async_param) {
    if (typeof async_param === 'undefined') {
      throw new Error('Cannot be called directly. call build()');
    }
    // TODO: Not supported yet
    // Object.assign(async_param, this);
    for(let k in async_param) this[k]=async_param[k];
  }

  // Persist all configs from defaults and split _words*
  dataToPersist() {
    let self = this;
    let data = {};

    // Save all settings using keys from _defaults
    Object.keys(Config._defaults).forEach(function(key) {
      if (self[key] !== undefined) {
        data[key] = self[key];
      }
    });

    if (self.words) {
      // Split words back into _words* for storage
      let splitWords = self.splitWords();
      Object.keys(splitWords).forEach(function(key) {
        data[key] = splitWords[key];
      });

      let wordKeys = Object.keys(self).filter(function(key) {
        return Config._wordsPattern.test(key);
      });

      wordKeys.forEach(function(key){
        data[key] = self[key];
      });
    }

    // console.log('dataToPersist', data); // DEBUG - Config
    return data;
  }

  // Async call to get provided keys (or default keys) from chrome storage
  // TODO: Keys: Doesn't support getting words
  static getConfig(keys?: string[]) {
    return new Promise(function(resolve, reject) {
      // Generate a request to use with chrome.storage
      let request = null;
      if (keys !== undefined) {
        request = {};
        for(let k of keys) { request[k] = Config._defaults[k]; }
      }

      chrome.storage.sync.get(request, function(items) {
        // Ensure defaults for undefined settings
        Object.keys(Config._defaults).forEach(function(defaultKey){
          if (request == null || arrayContains(Object.keys(request), defaultKey)) {
            if (items[defaultKey] === undefined) {
              items[defaultKey] = Config._defaults[defaultKey];
            }
          }
        });

        // Add words if requested, and provide _defaultWords if needed
        if (keys === undefined || arrayContains(keys, 'words')) {
          // Use default words if none were provided
          if (items._words0 === undefined || Object.keys(items._words0).length == 0) {
            items._words0 = Config._defaultWords;
          }
          Config.combineWords(items);
        }

        resolve(items);
      });
    });
  }

  removeProp(prop: string) {
    chrome.storage.sync.remove(prop);
    delete this[prop];
  }

  repeatForWord(word: string): boolean {
    if (this.words[word].repeat === true || this.words[word].repeat === false) {
      return this.words[word].repeat;
    } else {
      return this.defaultWordRepeat;
    }
  }

  reset() {
    return new Promise(function(resolve, reject) {
      chrome.storage.sync.clear(function() {
        resolve(chrome.runtime.lastError ? 1 : 0);
      });
    });
  }

  sanitizeWords() {
    let sanitizedWords = {};
    Object.keys(this.words).sort().forEach((key) => {
      sanitizedWords[key.trim().toLowerCase()] = this.words[key];
    });
    this.words = sanitizedWords;
  }

  save() {
    var self = this;
    return new Promise(function(resolve, reject) {
      chrome.storage.sync.set(self.dataToPersist(), function() {
        resolve(chrome.runtime.lastError ? 1 : 0);
      });
    });
  }

  splitWords() {
    let self = this;
    let currentContainerNum = 0;
    let currentWordNum = 0;
    // let wordsLength = JSON.stringify(self.words).length;
    // let wordContainers = Math.ceil(wordsLength/Config._maxBytes);
    // let wordsNum = Object.keys(self.words).length;
    let words = {};
    words[`_words${currentContainerNum}`] = {};

    Object.keys(self.words).sort().forEach(function(word) {
      if (currentWordNum == Config._maxWords) {
        currentContainerNum++;
        currentWordNum = 0;
        words[`_words${currentContainerNum}`] = {};
      }
      words[`_words${currentContainerNum}`][word] = self.words[word];
      currentWordNum++;
    });

    return words;
  }
}