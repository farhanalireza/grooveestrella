// src/lib/nlpProcessor.js

export class MusicNLPProcessor {
  constructor() {
    // Emotion mapping to database genres
    this.emotion_genre_mapping = {
      sad: ["sad_music", "blues_music", "melancholy_music"],
      happy: ["happy_music", "pop_music", "party_music"],
      romantic: ["romantic_music", "rnb_music", "jazz_music"],
      energetic: ["workout_music", "electronic_music", "rock_music"],
      relaxed: ["focus_music", "instrumental_music", "classical_music"],
      nostalgic: ["blues_music", "jazz_music", "classical_music"],
      motivated: ["motivational_music", "workout_music", "rap_music"],
      party: ["party_music", "electronic_music", "pop_music"],
      melancholy: ["melancholy_music", "sad_music", "blues_music"],
      focus: ["focus_music", "instrumental_music", "classical_music"],
    };

    // Emotion keywords
    this.emotion_keywords = {
      sad: [
        "sad", "depressed", "down", "blue", "crying", "heartbroken", "lonely", 
        "upset", "hurt", "low", "miserable", "gloomy", "devastated", "broken", 
        "disappointed", "hopeless", "grief", "sorrow", "despair", "melancholic", 
        "tearful", "weeping"
      ],
      happy: [
        "happy", "joyful", "excited", "cheerful", "glad", "upbeat", "positive", 
        "elated", "thrilled", "ecstatic", "delighted", "overjoyed", "euphoric", 
        "blissful", "jubilant", "gleeful"
      ],
      energetic: [
        "energetic", "pumped", "hyped", "active", "intense", "powerful", "strong", 
        "adrenaline", "boost", "motivation", "energy", "beast mode", "fired up", 
        "charged", "dynamic", "vigorous"
      ],
      romantic: [
        "love", "romantic", "crush", "valentine", "intimate", "romance", "affection", 
        "passion", "relationship", "boyfriend", "girlfriend", "husband", "wife", 
        "partner", "soulmate", "sweetheart", "darling", "beloved", "anniversary", 
        "proposal", "honeymoon"
      ],
      relaxed: [
        "chill", "relax", "calm", "peaceful", "meditation", "zen", "quiet", 
        "tranquil", "serene", "mellow", "soothing", "unwind", "decompress", 
        "breathe", "mindful", "ambient", "soft", "gentle", "laid back", "easygoing"
      ],
      party: [
        "party", "club", "dancing", "celebration", "fun", "wild", "night out", 
        "dance", "nightclub", "disco", "rave", "festival", "concert", "turn up", 
        "lit", "banging", "banger", "groove", "vibe"
      ],
      motivated: [
        "motivated", "determined", "driven", "ambitious", "focused", "goal", 
        "achieve", "success", "hustle", "grind", "push", "dedication", 
        "commitment", "persistence", "winner"
      ],
      nostalgic: [
        "nostalgic", "memories", "remember", "past", "childhood", "throwback", 
        "old times", "reminisce", "vintage", "classic", "retro", "old school", 
        "yesteryear"
      ],
      melancholy: [
        "melancholy", "bittersweet", "wistful", "pensive", "contemplative", 
        "reflective", "introspective", "thoughtful", "somber", "moody"
      ],
    };

    // Activity context mapping
    this.activity_mapping = {
      workout: ["workout_music", "electronic_music", "motivational_music"],
      gym: ["workout_music", "electronic_music", "motivational_music"],
      exercise: ["workout_music", "electronic_music", "motivational_music"],
      running: ["workout_music", "electronic_music", "motivational_music"],
      cardio: ["workout_music", "electronic_music", "motivational_music"],
      lifting: ["workout_music", "rock_music", "motivational_music"],
      study: ["focus_music", "instrumental_music", "classical_music"],
      studying: ["focus_music", "instrumental_music", "classical_music"],
      working: ["focus_music", "instrumental_music", "classical_music"],
      homework: ["focus_music", "instrumental_music", "classical_music"],
      reading: ["focus_music", "instrumental_music", "classical_music"],
      coding: ["focus_music", "instrumental_music", "electronic_music"],
      programming: ["focus_music", "instrumental_music", "electronic_music"],
      party: ["party_music", "electronic_music", "pop_music"],
      celebration: ["party_music", "pop_music", "happy_music"],
      driving: ["rock_music", "pop_music", "rap_music"],
      "road trip": ["rock_music", "pop_music", "classic_music"],
      cooking: ["jazz_music", "rnb_music", "pop_music"],
      cleaning: ["pop_music", "electronic_music", "motivational_music"],
      sleeping: ["instrumental_music", "classical_music", "ambient_music"],
      relaxing: ["instrumental_music", "classical_music", "jazz_music"],
      date: ["romantic_music", "jazz_music", "rnb_music"],
    };

    // Sentiment fallback indicators
    this.positive_indicators = [
      "good", "great", "awesome", "fantastic", "wonderful", "amazing", 
      "excellent", "perfect", "love", "best"
    ];
    this.negative_indicators = [
      "bad", "awful", "terrible", "horrible", "worst", "hate", "suck", 
      "disappointing", "frustrating"
    ];

    // Explicit content keywords
    this.explicit_words = new Set([
      "fuck", "fucking", "shit", "damn", "hell", "ass", "bitch", "bastard", "crap", 
      "piss", "cock", "dick", "pussy", "whore", "slut", "fag",
      "f*ck", "f**k", "sh*t", "sh**", "d*mn", "b*tch", "a**", "h*ll", "fck", 
      "sht", "dmn", "btch", "fuk", "shyt", "fcking", "fking",
      "weed", "marijuana", "cannabis", "pot", "high", "stoned", "blazed", "joint", 
      "blunt", "bong", "smoke", "lit", "dope", "hash", "cocaine", "coke", "crack", 
      "meth", "heroin", "pills", "molly", "ecstasy", "acid", "lsd", "shrooms", 
      "xanax", "adderall",
      "kill", "murder", "die", "death", "blood", "gun", "shoot", "knife", 
      "violence", "fight", "beat up", "assault", "attack", "war", "bomb",
      "sex", "sexual", "porn", "nude", "naked", "erotic", "orgasm", "masturbate", 
      "horny", "sexy", "seduction", "kinky", "fetish"
    ]);

    this.explicit_phrases = [
      /\b(?:getting|get)\s+(?:high|stoned|blazed|lit)\b/i,
      /\b(?:smoking|smoke)\s+(?:weed|pot|joint|blunt)\b/i,
      /\b(?:doing|taking|popping)\s+(?:drugs|pills|molly|ecstasy)\b/i,
      /\b(?:fuck|fucking)\s+(?:up|around|with)\b/i,
      /\b(?:beat|kill|murder)\s+(?:someone|somebody|them)\b/i,
      /\b(?:party|partying)\s+(?:hard|wild|crazy)\b/i,
      /\b(?:hookup|hook\s+up|one\s+night\s+stand)\b/i,
      /\b(?:strip|stripper|pole\s+dancing)\b/i
    ];

    this.explicit_genre_mapping = {
      profanity: ["rap_music", "rock_music"],
      drugs: ["rap_music", "rock_music", "blues_music"],
      violence: ["rock_music", "rap_music"],
      sexual: ["rnb_music", "rap_music", "pop_music"],
      party_explicit: ["party_music", "rap_music", "electronic_music", "pop_music"],
    };

    this._compile_patterns();
  }

  _compile_patterns() {
    this.emotion_patterns = {};
    this.activity_patterns = {};

    for (const [emotion, keywords] of Object.entries(this.emotion_keywords)) {
      if (keywords.length > 0) {
        const patternStr = "\\b(?:" + keywords.map(k => this._escapeRegExp(k)).join("|") + ")\\b";
        this.emotion_patterns[emotion] = new RegExp(patternStr, "gi");
      }
    }

    for (const activity of Object.keys(this.activity_mapping)) {
      const patternStr = "\\b" + this._escapeRegExp(activity) + "\\b";
      this.activity_patterns[activity] = new RegExp(patternStr, "gi");
    }

    // Compile explicit words pattern
    const explicitWordsArr = Array.from(this.explicit_words);
    const wordsPatternStr = "\\b(?:" + explicitWordsArr.map(w => this._escapeRegExp(w)).join("|") + ")\\b";
    this.explicit_pattern = new RegExp(wordsPatternStr, "gi");
  }

  _escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  preprocess_text(text) {
    if (!text || typeof text !== 'string') return "";

    let cleaned = text.toLowerCase().trim();

    const contractions = {
      "i'm": "i am",
      "i'd": "i would",
      "i'll": "i will",
      "i've": "i have",
      "you're": "you are",
      "you'd": "you would",
      "you'll": "you will",
      "you've": "you have",
      "he's": "he is",
      "she's": "she is",
      "it's": "it is",
      "we're": "we are",
      "they're": "they are",
      "don't": "do not",
      "won't": "will not",
      "can't": "cannot",
    };

    for (const [contraction, expansion] of Object.entries(contractions)) {
      cleaned = cleaned.replaceAll(contraction, expansion);
    }

    cleaned = cleaned.replace(/[^\w\s']/g, " ");
    cleaned = cleaned.replace(/\s+/g, " ");

    return cleaned.trim();
  }

  extract_emotions(text) {
    if (!text) return [];

    const processedText = this.preprocess_text(text);
    const emotionScores = {};

    for (const [emotion, pattern] of Object.entries(this.emotion_patterns)) {
      const matches = processedText.match(pattern);
      if (matches) {
        emotionScores[emotion] = (emotionScores[emotion] || 0) + matches.length;
      }
    }

    if (Object.keys(emotionScores).length === 0) {
      // Fallback simple sentiment indicators
      let positiveCount = 0;
      let negativeCount = 0;

      for (const word of this.positive_indicators) {
        if (processedText.includes(word)) positiveCount++;
      }
      for (const word of this.negative_indicators) {
        if (processedText.includes(word)) negativeCount++;
      }

      if (positiveCount > negativeCount && positiveCount > 0) {
        emotionScores["happy"] = 1;
      } else if (negativeCount > positiveCount && negativeCount > 0) {
        emotionScores["sad"] = 1;
      } else {
        return [];
      }
    }

    return Object.entries(emotionScores)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3);
  }

  extract_activities(text) {
    if (!text) return [];

    const processedText = this.preprocess_text(text);
    const activities = [];

    for (const [activity, pattern] of Object.entries(this.activity_patterns)) {
      if (pattern.test(processedText)) {
        activities.push(activity);
      }
    }

    return activities;
  }

  detect_explicit_content(text) {
    if (!text) {
      return {
        has_explicit: false,
        categories: [],
        words_found: [],
        phrases_found: [],
        severity: "none",
      };
    }

    const processedText = this.preprocess_text(text);
    const explicitInfo = {
      has_explicit: false,
      categories: [],
      words_found: [],
      phrases_found: [],
      severity: "none",
    };

    // Check for explicit words
    const wordMatches = processedText.match(this.explicit_pattern);
    if (wordMatches) {
      explicitInfo.has_explicit = true;
      explicitInfo.words_found = Array.from(new Set(wordMatches));
    }

    // Check for explicit phrases
    for (const pattern of this.explicit_phrases) {
      const phraseMatches = processedText.match(pattern);
      if (phraseMatches) {
        explicitInfo.has_explicit = true;
        explicitInfo.phrases_found.push(...phraseMatches);
      }
    }

    if (explicitInfo.has_explicit) {
      const categories = new Set();
      const allFound = [...explicitInfo.words_found, ...explicitInfo.phrases_found];

      for (const item of allFound) {
        const itemLower = item.toLowerCase();
        if (["fuck", "shit", "damn", "bitch", "ass", "hell"].some(word => itemLower.includes(word))) {
          categories.add("profanity");
        }
        if (["weed", "high", "stoned", "smoke", "drug", "pill", "molly"].some(word => itemLower.includes(word))) {
          categories.add("drugs");
        }
        if (["kill", "murder", "violence", "fight", "gun", "blood"].some(word => itemLower.includes(word))) {
          categories.add("violence");
        }
        if (["sex", "porn", "nude", "horny", "hookup"].some(word => itemLower.includes(word))) {
          categories.add("sexual");
        }
        if (["party hard", "party wild", "partying"].some(word => itemLower.includes(word))) {
          categories.add("party_explicit");
        }
      }

      explicitInfo.categories = Array.from(categories);

      const severityScore = explicitInfo.words_found.length + explicitInfo.phrases_found.length * 2;
      if (severityScore >= 5) {
        explicitInfo.severity = "high";
      } else if (severityScore >= 3) {
        explicitInfo.severity = "medium";
      } else {
        explicitInfo.severity = "low";
      }
    }

    return explicitInfo;
  }

  get_explicit_aware_genres(emotions, activities, explicitInfo) {
    const baseGenres = this.get_genre_recommendations(emotions, activities);

    if (!explicitInfo || !explicitInfo.has_explicit) {
      return baseGenres;
    }

    const explicitGenres = [];
    for (const category of explicitInfo.categories) {
      if (this.explicit_genre_mapping[category]) {
        explicitGenres.push(...this.explicit_genre_mapping[category]);
      }
    }

    const combinedGenres = [...explicitGenres, ...baseGenres];
    const seen = new Set();
    const result = [];

    for (const genre of combinedGenres) {
      if (!seen.has(genre)) {
        seen.add(genre);
        result.push(genre);
      }
    }

    return result.slice(0, 5);
  }

  get_genre_recommendations(emotions, activities = []) {
    const genreScores = {};

    for (const emotion of emotions) {
      if (this.emotion_genre_mapping[emotion]) {
        for (const genre of this.emotion_genre_mapping[emotion]) {
          genreScores[genre] = (genreScores[genre] || 0) + 3;
        }
      }
    }

    if (activities) {
      for (const activity of activities) {
        if (this.activity_mapping[activity]) {
          for (const genre of this.activity_mapping[activity]) {
            genreScores[genre] = (genreScores[genre] || 0) + 2;
          }
        }
      }
    }

    if (Object.keys(genreScores).length > 0) {
      // Group genres by score
      const scoreGroups = {};
      for (const [genre, score] of Object.entries(genreScores)) {
        if (!scoreGroups[score]) {
          scoreGroups[score] = [];
        }
        scoreGroups[score].push(genre);
      }

      // Sort scores descending, shuffle genres in each score group, and flatten
      const finalList = [];
      const sortedScores = Object.keys(scoreGroups).map(Number).sort((a, b) => b - a);

      for (const score of sortedScores) {
        const shuffledGroup = this._shuffle(scoreGroups[score]);
        finalList.push(...shuffledGroup);
      }

      return finalList.slice(0, 5);
    } else {
      const fallback = ["trending_music", "top_music", "developers_choice_music"];
      return this._shuffle(fallback);
    }
  }

  _shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  calculate_confidence(emotions, activities, text) {
    if (!text) return 0.1;

    let baseScore = 0.2;

    if (emotions && emotions.length > 0) {
      baseScore += Math.min(emotions.length * 0.15, 0.4);
    }

    if (activities && activities.length > 0) {
      baseScore += Math.min(activities.length * 0.1, 0.2);
    }

    const wordCount = text.split(/\s+/).length;
    baseScore += Math.min(wordCount / 20, 0.2);

    return Math.min(baseScore, 0.9);
  }

  process_user_message(message) {
    try {
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return {
          emotions: [],
          activities: [],
          recommended_genres: ["trending_music", "top_music", "developers_choice_music"],
          confidence: 0.1,
          processing_time: 0,
          text_length: 0,
        };
      }

      const startTime = Date.now();

      const emotions = this.extract_emotions(message);
      const activities = this.extract_activities(message);
      const explicitInfo = this.detect_explicit_content(message);
      const genres = this.get_explicit_aware_genres(emotions, activities, explicitInfo);
      const confidence = this.calculate_confidence(emotions, activities, message);

      const processingTime = Date.now() - startTime;

      return {
        emotions,
        activities,
        explicit_content: explicitInfo,
        recommended_genres: genres,
        confidence: Math.round(confidence * 100) / 100,
        processing_time: processingTime,
        text_length: message.length,
        processed_text: this.preprocess_text(message),
      };
    } catch (e) {
      console.error("Error processing message:", e);
      return {
        emotions: [],
        activities: [],
        explicit_content: {
          has_explicit: false,
          categories: [],
          words_found: [],
          phrases_found: [],
          severity: "none",
        },
        recommended_genres: ["trending_music", "top_music", "developers_choice_music"],
        confidence: 0.1,
        error: e.message,
        processing_time: 0,
        text_length: 0,
      };
    }
  }

  generate_response(analysisResult, userMessage = "") {
    try {
      const emotions = analysisResult.emotions || [];
      const activities = analysisResult.activities || [];
      const genres = analysisResult.recommended_genres || [];
      const confidence = analysisResult.confidence || 0.1;
      const explicitInfo = analysisResult.explicit_content || {};

      const hasExplicit = explicitInfo.has_explicit || false;
      const explicitSeverity = explicitInfo.severity || "none";

      if (confidence < 0.3 || emotions.length === 0) {
        let baseMessage = "I don't quite understand what you're looking for, but here are some trending and popular tracks that most people love!";
        if (hasExplicit && ["medium", "high"].includes(explicitSeverity)) {
          baseMessage += " I notice you might be looking for music with explicit content - I can recommend tracks that match that vibe.";
        }

        return {
          message: baseMessage,
          genres: genres.length >= 3 ? genres.slice(0, 3) : ["trending_music", "top_music", "developers_choice_music"],
          follow_up: "What's your vibe right now? Are you looking for something to match your mood or change it?",
          confidence,
          content_warning: hasExplicit && explicitSeverity === "high",
        };
      }

      const responseParts = [];

      if (emotions.length > 0) {
        const emotionText = this._format_emotions(emotions);
        if (activities.length > 0) {
          const activityText = this._format_activities(activities);
          responseParts.push(`I can sense you're feeling ${emotionText} and looking for something for ${activityText}.`);
        } else {
          responseParts.push(`I can feel that ${emotionText} vibe from you.`);
        }

        if (hasExplicit) {
          if (explicitSeverity === "high") {
            responseParts.push("I understand you're looking for music with explicit content that matches your energy.");
          } else if (explicitSeverity === "medium") {
            responseParts.push("I can include some edgier tracks in the mix.");
          }
        }
      }

      if (confidence > 0.7) {
        responseParts.push("I'm quite confident these songs will hit the right note:");
      } else if (confidence > 0.5) {
        responseParts.push("Here are some songs that should match your mood:");
      } else {
        responseParts.push("Let me suggest some music that might work for you:");
      }

      const message = responseParts.join(" ");

      return {
        message,
        genres: genres.slice(0, 3),
        follow_up: this._generate_follow_up(emotions, activities, confidence, explicitInfo),
        confidence,
        personalization_level: confidence > 0.6 ? "high" : confidence > 0.3 ? "medium" : "low",
        content_warning: hasExplicit && explicitSeverity === "high",
        explicit_detected: hasExplicit,
      };
    } catch (e) {
      console.error("Error generating response:", e);
      return {
        message: "I'm here to help you find great music! What kind of mood are you in?",
        genres: ["trending_music", "top_music", "developers_choice_music"],
        follow_up: "Tell me about your current feelings or what you're planning to do.",
        confidence: 0.1,
        error: e.message,
      };
    }
  }

  _format_emotions(emotions) {
    if (!emotions || emotions.length === 0) return "neutral";
    if (emotions.length === 1) return emotions[0];
    if (emotions.length === 2) return `${emotions[0]} and ${emotions[1]}`;
    return `${emotions.slice(0, -1).join(", ")}, and ${emotions[emotions.length - 1]}`;
  }

  _format_activities(activities) {
    if (!activities || activities.length === 0) return "general listening";
    if (activities.length === 1) return activities[0];
    return `${activities.slice(0, -1).join(", ")}, and ${activities[activities.length - 1]}`;
  }

  _generate_follow_up(emotions, activities, confidence, explicitInfo = null) {
    const followUps = {
      sad: "Would you like something to help process these feelings, or perhaps something uplifting?",
      happy: "Want to keep this positive energy flowing with more upbeat tracks?",
      romantic: "Looking for something intimate or more broadly love-themed?",
      energetic: "Perfect for keeping that energy high! Need something specific for working out?",
      relaxed: "Great for unwinding! Want pure instrumental or something with gentle vocals?",
      motivated: "Love that drive! Want something to maintain that momentum?",
      party: "Ready to get this party started? Need something danceable?",
      nostalgic: "Those memories deserve the perfect soundtrack. Want classic hits or newer songs with vintage vibes?",
      melancholy: "Sometimes we need music that understands. Want something contemplative?",
      focus: "Perfect for productivity! Need something completely instrumental?",
    };

    if (explicitInfo && explicitInfo.has_explicit) {
      const explicitSeverity = explicitInfo.severity || "none";
      if (["medium", "high"].includes(explicitSeverity)) {
        if (confidence < 0.4) {
          return "I can include explicit content in the recommendations. Want me to adjust the intensity level?";
        } else if (emotions.length > 0 && ["energetic", "party", "motivated"].includes(emotions[0])) {
          return "Want me to include more explicit tracks that match this high-energy vibe?";
        }
      }
    }

    if (confidence < 0.4) {
      return "How do these sound? I can adjust the recommendations based on your feedback!";
    }

    if (emotions.length > 0 && followUps[emotions[0]]) {
      return followUps[emotions[0]];
    } else if (activities.length > 0) {
      return `These should work great for ${activities[0]}! Want me to adjust for any specific preferences?`;
    } else {
      return "How do these recommendations feel? I can fine-tune them based on your feedback!";
    }
  }
}
