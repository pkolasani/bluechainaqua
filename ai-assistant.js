/* Blue Chain Aqua - multilingual text + voice AI assistant.
   Local test mode: config.js contains the Groq key. Move the key server-side before production.
*/
(function () {
  'use strict';

  function init() {
    var root = document.getElementById('bcaAi');
    var launch = document.getElementById('bcaAiLaunch');
    var panel = document.getElementById('bcaAiPanel');
    var close = document.getElementById('bcaAiClose');
    var form = document.getElementById('bcaAiForm');
    var input = document.getElementById('bcaAiInput');
    var send = document.getElementById('bcaAiSend');
    var mic = document.getElementById('bcaAiMic');
    var language = document.getElementById('bcaAiLanguage');
    var voiceToggle = document.getElementById('bcaAiVoiceToggle');
    var voiceStatus = document.getElementById('bcaAiVoiceStatus');
    var messages = document.getElementById('bcaAiMessages');
    var suggestions = document.getElementById('bcaAiSuggestions');
    var historyBtn = document.getElementById('bcaAiHistoryBtn');
    var historyPanel = document.getElementById('bcaAiHistory');
    var historyList = document.getElementById('bcaAiHistoryList');
    var historyEmpty = document.getElementById('bcaAiHistoryEmpty');
    var newChatBtn = document.getElementById('bcaAiNewChat');

    if (!root || !launch || !panel || !close || !form || !input || !send || !mic || !language || !messages) return;

    var history = [];
    var conversationMessages = [];
    var chatSessions = [];
    var currentSessionId = null;
    var CHAT_STORAGE_KEY = 'bca_aqua_ai_chat_history_v1';
    var WELCOME_MESSAGE = 'Hello! I can help with aquaculture and fisheries topics such as pond preparation, water quality, shrimp/fish farming, biofloc, RAS, hatchery, feed, disease prevention, harvesting, processing, project planning and schemes.';
    var busy = false;
    var recording = false;
    var mediaRecorder = null;
    var speechRecognition = null;
    var audioChunks = [];
    var voiceOutput = true;
    var currentAudio = null;
    var navigatingAway = false;

    // Stop every active voice/recording operation. This is intentionally exposed
    // so navigation and page lifecycle handlers can call it too.
    function stopAllVoice() {
      navigatingAway = true;
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
      if (currentAudio) {
        try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) {}
        currentAudio = null;
      }
      if (speechRecognition) {
        try { speechRecognition.onend = null; speechRecognition.stop(); } catch (e) {}
        speechRecognition = null;
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try { mediaRecorder.stop(); } catch (e) {}
      }
      if (mediaRecorder && mediaRecorder.stream) {
        try { mediaRecorder.stream.getTracks().forEach(function (track) { track.stop(); }); } catch (e) {}
      }
      mediaRecorder = null;
      audioChunks = [];
      recording = false;
      if (mic) {
        mic.classList.remove('recording');
        mic.textContent = '🎙️';
        mic.setAttribute('aria-label', 'Speak your question');
      }
    }

    window.BCA_STOP_VOICE = stopAllVoice;

    var localized = {
      English: {
        placeholder: 'Ask an aquaculture question...',
        changed: 'Answer language is now English. You can speak in English, Telugu or Hindi.',
        error: 'Sorry, I could not process that question. Please check your API key and internet connection, then try again.',
        listening: '🎙️ Listening… speak your question now.',
        transcribing: '⌛ Converting your voice to text…',
        micError: 'Microphone access was not available. Please allow microphone permission in Chrome.',
        noSpeech: 'I could not hear a clear question. Please try again.',
        voiceOn: '🔊 Voice On',
        voiceOff: '🔇 Voice Off'
      },
      Telugu: {
        placeholder: 'ఆక్వాకల్చర్ గురించి మీ ప్రశ్న అడగండి...',
        changed: 'సమాధాన భాష ఇప్పుడు తెలుగు. మీరు తెలుగు, హిందీ లేదా ఇంగ్లీష్‌లో మాట్లాడవచ్చు.',
        error: 'క్షమించండి, మీ ప్రశ్నను ప్రాసెస్ చేయలేకపోయాను. API కీ మరియు ఇంటర్నెట్ కనెక్షన్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.',
        listening: '🎙️ వింటున్నాను… మీ ప్రశ్నను ఇప్పుడు మాట్లాడండి.',
        transcribing: '⌛ మీ మాటలను టెక్స్ట్‌గా మార్చుతున్నాను…',
        micError: 'మైక్రోఫోన్ యాక్సెస్ అందుబాటులో లేదు. Chromeలో మైక్రోఫోన్ అనుమతిని ఇవ్వండి.',
        noSpeech: 'మీ ప్రశ్న స్పష్టంగా వినిపించలేదు. మళ్లీ ప్రయత్నించండి.',
        voiceOn: '🔊 వాయిస్ ఆన్',
        voiceOff: '🔇 వాయిస్ ఆఫ్'
      },
      Hindi: {
        placeholder: 'एक्वाकल्चर से जुड़ा प्रश्न पूछें...',
        changed: 'उत्तर की भाषा अब हिन्दी है। आप हिन्दी, तेलुगु या अंग्रेज़ी में बोल सकते हैं।',
        error: 'क्षमा करें, आपका प्रश्न प्रोसेस नहीं हो सका। API key और इंटरनेट कनेक्शन जांचकर फिर प्रयास करें।',
        listening: '🎙️ सुन रहा हूँ… अब अपना प्रश्न बोलें।',
        transcribing: '⌛ आपकी आवाज़ को टेक्स्ट में बदल रहा हूँ…',
        micError: 'माइक्रोफ़ोन उपलब्ध नहीं है। Chrome में माइक्रोफ़ोन की अनुमति दें।',
        noSpeech: 'आपका प्रश्न स्पष्ट रूप से सुनाई नहीं दिया। फिर से प्रयास करें।',
        voiceOn: '🔊 आवाज़ चालू',
        voiceOff: '🔇 आवाज़ बंद'
      }
    };

    function selectedLangCode() {
      return language.value === 'Telugu' ? 'te-IN' : language.value === 'Hindi' ? 'hi-IN' : 'en-IN';
    }

    function makeId() {
      return 'chat_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    }

    function loadChatSessions() {
      try {
        var raw = localStorage.getItem(CHAT_STORAGE_KEY);
        chatSessions = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(chatSessions)) chatSessions = [];
      } catch (e) {
        chatSessions = [];
      }
      chatSessions = chatSessions.filter(function (s) { return s && s.id && Array.isArray(s.messages) && s.messages.length; }).slice(0, 20);
      renderHistoryList();
    }

    function persistChatSessions() {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatSessions.slice(0, 20)));
      } catch (e) {
        console.warn('Could not save Aqua AI chat history:', e);
      }
    }

    function saveCurrentSession() {
      if (!currentSessionId || !conversationMessages.length) return;
      var firstUser = conversationMessages.find(function (m) { return m.role === 'user'; });
      if (!firstUser) return;
      var title = firstUser.text.trim().replace(/\s+/g, ' ');
      if (title.length > 46) title = title.slice(0, 46).trim() + '…';
      var existing = chatSessions.find(function (s) { return s.id === currentSessionId; });
      var session = {
        id: currentSessionId,
        title: title || 'Aqua AI chat',
        updatedAt: Date.now(),
        messages: conversationMessages.slice(-40)
      };
      if (existing) Object.assign(existing, session);
      else chatSessions.unshift(session);
      chatSessions.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
      chatSessions = chatSessions.slice(0, 20);
      persistChatSessions();
      renderHistoryList();
    }

    function renderHistoryList() {
      if (!historyList || !historyEmpty) return;
      historyList.innerHTML = '';
      historyEmpty.style.display = chatSessions.length ? 'none' : 'block';
      chatSessions.forEach(function (session) {
        var item = document.createElement('button');
        item.type = 'button';
        item.className = 'bca-ai-history-item' + (session.id === currentSessionId ? ' active' : '');
        item.setAttribute('data-session-id', session.id);
        var title = document.createElement('strong');
        title.textContent = session.title || 'Aqua AI chat';
        var meta = document.createElement('small');
        var date = new Date(session.updatedAt || Date.now());
        meta.textContent = date.toLocaleDateString([], { day: '2-digit', month: 'short' }) + ' · ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        item.appendChild(title);
        item.appendChild(meta);
        item.addEventListener('click', function () { loadChatSession(session.id); });
        historyList.appendChild(item);
      });
    }

    function renderConversation() {
      messages.innerHTML = '';
      addMessage('bot', WELCOME_MESSAGE);
      conversationMessages.forEach(function (message) {
        addMessage(message.role === 'assistant' ? 'bot' : 'user', message.text);
      });
      messages.scrollTop = messages.scrollHeight;
    }

    function startNewChat() {
      if (busy) return;
      currentSessionId = makeId();
      history = [];
      conversationMessages = [];
      renderConversation();
      closeHistory();
      input.value = '';
      input.focus();
    }

    function loadChatSession(id) {
      if (busy) return;
      var session = chatSessions.find(function (s) { return s.id === id; });
      if (!session) return;
      currentSessionId = session.id;
      conversationMessages = Array.isArray(session.messages) ? session.messages.slice(-40) : [];
      history = conversationMessages.slice(-8).map(function (m) {
        return { role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text };
      });
      renderConversation();
      renderHistoryList();
      closeHistory();
      input.focus();
    }

    function openHistory() {
      if (!historyPanel) return;
      historyPanel.hidden = false;
      historyPanel.removeAttribute('hidden');
      if (historyBtn) historyBtn.setAttribute('aria-expanded', 'true');
      renderHistoryList();
    }

    function closeHistory() {
      if (!historyPanel) return;
      historyPanel.hidden = true;
      historyPanel.setAttribute('hidden', '');
      if (historyBtn) historyBtn.setAttribute('aria-expanded', 'false');
    }

    function openPanel() {
      closeHistory();
      panel.hidden = false;
      panel.removeAttribute('hidden');
      panel.style.display = 'flex';
      launch.setAttribute('aria-expanded', 'true');
      setTimeout(function () { input.focus(); }, 50);
    }

    function closePanel() {
      stopRecording();
      closeHistory();
      panel.hidden = true;
      panel.setAttribute('hidden', '');
      panel.style.display = 'none';
      launch.setAttribute('aria-expanded', 'false');
    }

    function addMessage(role, text, extra) {
      var wrap = document.createElement('div');
      wrap.className = 'bca-ai-message ' + role;
      var bubble = document.createElement('div');
      bubble.className = 'bca-ai-bubble' + (extra ? ' ' + extra : '');
      bubble.textContent = text;
      wrap.appendChild(bubble);

      if (role === 'bot' && text && extra !== 'typing') {
        var speakBtn = document.createElement('button');
        speakBtn.type = 'button';
        speakBtn.className = 'bca-ai-speak-message';
        speakBtn.textContent = '🔊';
        speakBtn.title = 'Read this answer aloud';
        speakBtn.setAttribute('aria-label', 'Read this answer aloud');
        speakBtn.addEventListener('click', function () { speakText(text); });
        wrap.appendChild(speakBtn);
      }

      messages.appendChild(wrap);
      messages.scrollTop = messages.scrollHeight;
      return bubble;
    }

    function setVoiceStatus(text) {
      if (voiceStatus) voiceStatus.textContent = text;
    }

    function speakText(text) {
      if (navigatingAway || !('speechSynthesis' in window) || !text) return;

      var lang = selectedLangCode();

      function speakWithCorrectVoice() {
        try {
          window.speechSynthesis.cancel();

          var utter = new SpeechSynthesisUtterance(text);
          utter.lang = lang;
          utter.rate = 0.96;
          utter.pitch = 1;

          var voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
          var wanted = String(lang || '').toLowerCase();
          var voice = voices.find(function (v) {
            return String(v.lang || '').toLowerCase() === wanted;
          });

          if (!voice) {
            var languageCode = wanted.split('-')[0];
            voice = voices.find(function (v) {
              return String(v.lang || '').toLowerCase().split('-')[0] === languageCode;
            });
          }

          if (voice) {
            utter.voice = voice;
            utter.lang = voice.lang;
          }

          utter.onstart = function () {
            setVoiceStatus(
              language.value === 'Telugu'
                ? '🔊 తెలుగు వాయిస్‌లో మాట్లాడుతోంది…'
                : language.value === 'Hindi'
                  ? '🔊 हिन्दी आवाज़ में बोल रहा है…'
                  : '🔊 Speaking in English…'
            );
          };

          utter.onend = function () {
            if (!navigatingAway) setVoiceStatus(localized[language.value].changed);
          };

          utter.onerror = function (event) {
            console.warn('Speech synthesis error:', event);
          };

          window.speechSynthesis.speak(utter);
        } catch (e) {
          console.warn('Speech synthesis unavailable:', e);
        }
      }

      var voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      if (voices && voices.length) {
        speakWithCorrectVoice();
      } else {
        var onVoicesChanged = function () {
          window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
          if (!navigatingAway) speakWithCorrectVoice();
        };
        window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

        setTimeout(function () {
          if (!navigatingAway && !window.speechSynthesis.speaking) speakWithCorrectVoice();
        }, 500);
      }
    }

    function updateVoiceToggle() {
      if (!voiceToggle) return;
      voiceToggle.textContent = voiceOutput ? localized[language.value].voiceOn : localized[language.value].voiceOff;
      voiceToggle.setAttribute('aria-pressed', voiceOutput ? 'true' : 'false');
    }

    async function transcribeBlob(blob) {
      var sttModel = String((window.BCA_CONFIG || {}).GROQ_STT_MODEL || 'whisper-large-v3-turbo').trim();

      var extension = (blob.type || '').includes('mp4') ? 'mp4' : 'webm';
      var file = new File([blob], 'bca-question.' + extension, { type: blob.type || 'audio/webm' });
      var fd = new FormData();
      fd.append('file', file);
      fd.append('model', sttModel);
      fd.append('response_format', 'json');
      fd.append('temperature', '0');

      var res = await fetch('/api/transcribe', {
        method: 'POST',
        body: fd
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || ('Speech-to-text HTTP ' + res.status));
      return String(data.text || '').trim();
    }

    function startSpeechRecognition() {
      var Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) return false;

      try {
        var recognition = new Recognition();
        speechRecognition = recognition;
        recognition.lang = selectedLangCode();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recording = true;
        mic.classList.add('recording');
        mic.textContent = '⏹️';
        mic.setAttribute('aria-label', 'Stop listening');
        setVoiceStatus(localized[language.value].listening);

        recognition.onresult = function (event) {
          var transcript = '';
          for (var i = event.resultIndex || 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript || '';
          }
          transcript = transcript.trim();
          if (transcript) {
            input.value = transcript;
            setVoiceStatus('✓ ' + transcript);
            ask(transcript);
          } else {
            setVoiceStatus(localized[language.value].noSpeech);
          }
        };

        recognition.onerror = function (event) {
          console.warn('Browser speech recognition error:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setVoiceStatus(localized[language.value].micError);
          } else if (event.error === 'no-speech') {
            setVoiceStatus(localized[language.value].noSpeech);
          } else {
            setVoiceStatus('Voice recognition failed. Please try again.');
          }
        };

        recognition.onend = function () {
          recording = false;
          speechRecognition = null;
          mic.classList.remove('recording');
          mic.textContent = '🎙️';
          mic.setAttribute('aria-label', 'Speak your question');
        };

        recognition.start();
        return true;
      } catch (err) {
        console.warn('Browser speech recognition could not start:', err);
        speechRecognition = null;
        recording = false;
        return false;
      }
    }

    async function startRecording() {
      if (recording || busy) return;

      // Prefer native Chrome/Android speech recognition. It is much more
      // reliable on phones than uploading a MediaRecorder WebM blob and it
      // uses the currently selected English/Telugu/Hindi language directly.
      if (startSpeechRecognition()) return;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
        setVoiceStatus('Voice input is not supported by this browser. Please use Chrome or Edge over HTTPS.');
        return;
      }

      try {
        var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        var preferred = 'audio/webm;codecs=opus';
        var mime = MediaRecorder.isTypeSupported(preferred) ? preferred : 'audio/webm';
        mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
        audioChunks = [];
        recording = true;
        mic.classList.add('recording');
        mic.textContent = '⏹️';
        mic.setAttribute('aria-label', 'Stop recording');
        setVoiceStatus(localized[language.value].listening);

        mediaRecorder.ondataavailable = function (event) {
          if (event.data && event.data.size) audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async function () {
          stream.getTracks().forEach(function (track) { track.stop(); });
          recording = false;
          mic.classList.remove('recording');
          mic.textContent = '🎙️';
          mic.setAttribute('aria-label', 'Speak your question');
          if (navigatingAway) {
            audioChunks = [];
            return;
          }
          if (!audioChunks.length) {
            setVoiceStatus(localized[language.value].noSpeech);
            return;
          }
          var blob = new Blob(audioChunks, { type: mime });
          audioChunks = [];
          setVoiceStatus(localized[language.value].transcribing);
          try {
            var transcript = await transcribeBlob(blob);
            if (!transcript) throw new Error('empty');
            input.value = transcript;
            setVoiceStatus('✓ ' + transcript);
            ask(transcript);
          } catch (err) {
            console.error('Speech transcription error:', err);
            setVoiceStatus(localized[language.value].micError + ' ' + (err.message || ''));
          }
        };

        mediaRecorder.start();
      } catch (err) {
        console.error('Microphone error:', err);
        setVoiceStatus(localized[language.value].micError);
      }
    }

    function stopRecording() {
      if (speechRecognition) {
        try { speechRecognition.stop(); } catch (e) {}
        return;
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    }

    async function ask(question) {
      var text = String(question || '').trim();
      if (!text || busy) return;

      var cfg = window.BCA_CONFIG || {};
      var model = String(cfg.GROQ_MODEL || 'openai/gpt-oss-120b').trim();

      busy = true;
      send.disabled = true;
      mic.disabled = true;
      input.disabled = true;
      addMessage('user', text);
      conversationMessages.push({ role: 'user', text: text });
      saveCurrentSession();
      var typing = addMessage('bot', 'Thinking…', 'typing');

      var selectedLanguage = language.value;
      var languageName = selectedLanguage === 'Telugu' ? 'Telugu' : selectedLanguage === 'Hindi' ? 'Hindi' : 'English';

      var systemPrompt = [
        'You are Blue Chain Aqua AI, the dedicated AI assistant for Blue Chain Aqua, an Aquaculture & Fisheries Consultancy in India.',
        '',
        'STRICT SCOPE: Answer aquaculture AND fisheries questions. Fisheries is explicitly in scope, including capture fisheries, inland fisheries, marine fisheries, fish production, fishing activities, fish landing, cold chain, fish processing, fisheries infrastructure, fisher welfare, fisheries schemes, government programmes, fisheries finance, and aquaculture.',
        'IN-SCOPE EXAMPLES THAT MUST BE ANSWERED: FIDF (Fisheries and Aquaculture Infrastructure Development Fund), PMMSY, KCC for fisheries, fisheries subsidies, fish farming, shrimp farming, hatcheries, biofloc, RAS, ponds, cages, water quality, feed, disease prevention, stocking, nursery, grow-out, harvesting, processing, cold storage, ice plants, fishing boats, fisheries infrastructure, DPRs, project finance, scheme eligibility, documentation, and Blue Chain Aqua services/projects.',
        'IMPORTANT: A question containing words such as fish, fisheries, fisher, fishing, shrimp, prawn, aquaculture, FIDF, PMMSY, hatchery, pond, biofloc, RAS, feed, fish disease, fish processing, cold storage, fisheries scheme or fisheries subsidy is an aquaculture/fisheries question and MUST NOT be refused as unrelated.',
        'If the user asks anything genuinely unrelated to aquaculture or fisheries, politely refuse and say that you only handle aquaculture and fisheries topics. Do not refuse a fisheries question merely because it concerns a government scheme, finance, infrastructure, fishing, processing or a fisheries-related abbreviation.',
        '',
        'IMPORTANT LANGUAGE RULE: The user may ask in English, Telugu, Hindi, or a mixture of them. ALWAYS answer ONLY in ' + languageName + ', regardless of the language used in the question. Do not switch the answer language based on the question language.',
        'If the selected answer language is Telugu, use natural Telugu script. If Hindi, use natural Devanagari script. If English, use English.',
        'Keep answers practical and clear for farmers and project owners.',
        'Do not claim to be a government authority. For project-specific technical, veterinary, chemical, legal, financial or regulatory decisions, provide general information and recommend a qualified professional where appropriate.',
        '',
        'BLUE CHAIN AQUA CONTEXT: Services include farmer onboarding, site/water assessment, scheme identification, DPR and documentation, submission/follow-up, sanction/disbursement coordination, implementation support, pond preparation, hatchery, grow-out farming, harvesting, processing/value addition, market/supply-chain planning and blue-economy projects. Known project coverage includes Andhra Pradesh, Telangana, Odisha, Kerala and West Bengal.'
      ].join('\n');

      var apiMessages = [{ role: 'system', content: systemPrompt }].concat(history.slice(-8)).concat([{ role: 'user', content: text }]);

      try {
        var res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            language: selectedLanguage,
            messages: apiMessages,
            temperature: 0.3,
            max_completion_tokens: 900
          })
        });
        var data = await res.json().catch(function () { return {}; });
        if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status));
        var answer = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!answer) throw new Error('No answer returned by Groq.');
        answer = String(answer).trim();
        typing.textContent = answer;
        typing.classList.remove('typing');
        history.push({ role: 'user', content: text });
        history.push({ role: 'assistant', content: answer });
        conversationMessages.push({ role: 'assistant', text: answer });
        if (history.length > 8) history = history.slice(-8);
        saveCurrentSession();
        if (voiceOutput && !navigatingAway) speakText(answer);
      } catch (err) {
        console.error('Blue Chain Aqua AI error:', err);
        typing.textContent = localized[selectedLanguage].error + ' (' + (err.message || 'request failed') + ')';
        typing.classList.remove('typing');
      } finally {
        busy = false;
        send.disabled = false;
        mic.disabled = false;
        input.disabled = false;
        if (!navigatingAway) input.focus();
        messages.scrollTop = messages.scrollHeight;
      }
    }

    if (historyBtn) {
      historyBtn.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (historyPanel && historyPanel.hidden) openHistory(); else closeHistory();
      });
    }

    if (newChatBtn) {
      newChatBtn.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        startNewChat();
      });
    }

    loadChatSessions();
    currentSessionId = makeId();
    renderConversation();

    launch.addEventListener('click', function (event) {
      event.preventDefault(); event.stopPropagation();
      navigatingAway = false;
      if (panel.hidden) openPanel(); else closePanel();
    });

    close.addEventListener('click', function (event) {
      event.preventDefault(); event.stopPropagation(); closePanel();
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      input.value = '';
      ask(text);
    });

    mic.addEventListener('click', function () {
      if (recording) stopRecording(); else startRecording();
    });

    language.addEventListener('change', function () {
      input.placeholder = localized[language.value].placeholder;
      updateVoiceToggle();
      setVoiceStatus(localized[language.value].changed);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    });

    if (voiceToggle) {
      voiceToggle.addEventListener('click', function () {
        voiceOutput = !voiceOutput;
        if (!voiceOutput && 'speechSynthesis' in window) window.speechSynthesis.cancel();
        updateVoiceToggle();
      });
    }

    if (suggestions) {
      suggestions.querySelectorAll('button').forEach(function (button) {
        button.addEventListener('click', function () {
          var q = button.getAttribute('data-question') || '';
          input.value = q;
          ask(q);
          input.value = '';
        });
      });
    }

    // Navigation must immediately silence the assistant, including same-page hash navigation.
    document.addEventListener('click', function (event) {
      var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
      if (!link) return;
      var href = link.getAttribute('href') || '';
      if (!href || href === '#' || href.toLowerCase().startsWith('javascript:')) return;
      var isNavigation = href.charAt(0) === '#' || href.indexOf(window.location.origin) === 0 || /^[./]/.test(href);
      if (isNavigation) stopAllVoice();
    }, true);

    window.addEventListener('hashchange', stopAllVoice);
    window.addEventListener('popstate', stopAllVoice);
    window.addEventListener('pagehide', stopAllVoice);
    window.addEventListener('beforeunload', stopAllVoice);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) closePanel();
    });

    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
    updateVoiceToggle();
    closePanel();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
