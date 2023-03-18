let showGPT = false;
let apiKeyChatGPT = '';

// fetch('./credentials.json')
//   .then(response => response.json())
//   .then(data => {
    apiKeyChatGPT = '';//data.apiKey;
    document.addEventListener("selectionchange", () =>
      debounce(showDropdownMenu, 1000)
    );
// });

const idDropdownMenu = "dropdown123";
const debounced = [];

function debounce(func, wait) {
  debounced.forEach((x) => clearTimeout(x));
  const debouncedFunc = setTimeout(() => {
    func();
  }, wait || 0);
  debounced.push(debouncedFunc);
}

async function translate(text, source, target) {
  text = text.replace(/%/g, "procent");
  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&hl=en-US&dt=qca&dt=t&dt=bd&dj=1&source=icon&sl=${source}&tl=${target}&q=${text}`
  );
  const json = await response.json();
  return json.sentences?.map((x) => x.trans).join(" ");
}

async function chatGPT(text) {
  const data = await (await fetch(`https://api.openai.com/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKeyChatGPT}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{
        'role': 'user',
        'content': text
      }]
    })
  })).json();
  return data.choices[0].message.content;
}

async function detectLanguage(text) {
  text = text.slice(0, 1000);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=nl&hl=nl&dt=t&dt=bd&dj=1&source=bubble&tk=200215.200215&q=${text}`;
  const response = await (await fetch(url)).json();
  return response.ld_result?.srclangs?.[0];
}

async function translateBiggerTexts(text, source, target) {
  const maxSize = 1500;
  const result = [];
  for (let i = 0; i < text.length; i += maxSize) {
    const translation = await translate(
      text.slice(i, i + maxSize),
      source,
      target
    );
    result.push(translation);
  }
  return result.join(" ");
}

async function onSelection(text) {
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Create a new div element for the dropdown menu
  const dropdown =
    document.getElementById(idDropdownMenu) || document.createElement("div");
  dropdown.setAttribute("id", idDropdownMenu);
  dropdown.innerHTML = "";

  // Set the position of the dropdown menu to appear just beneath the selection
  dropdown.setAttribute("class", "dropdownExtension");
  dropdown.style.display = "block";
  dropdown.style.position = "absolute";
  dropdown.style.left = rect.x + "px";

  // // Create a nested ul element for the menu items
  const menu = document.createElement("ul");

  const fromLang = await detectLanguage(text);

  const encodedText = encodeURIComponent(text);

  // Add some sample menu items
  const items = [
    { name: "Speak", func: () => detectAndSpeak(text) },
    { name: "Copy", func: () => navigator.clipboard.writeText(text) },
    { name: "GPT explain", func: () => askGPT('Explain the following: ' + text) },
    { name: "Youglish", func: () => detectAndGoToYouglish(text) },
    { name: "YouTok", url: "https://youtokker.web.app/?q=" + encodedText },
    {
      name: "Wikipedia",
      url:
        "https://nl.wikipedia.org/w/index.php?go=Artikel&search=" +
        encodedText +
        "&title=Speciaal%3AZoeken&ns0=1",
    },
    { name: "Google", url: "https://www.google.com/search?q=" + encodedText },
    {
      name: "YouTube",
      url: "https://www.youtube.com/results?search_query=" + encodedText,
    },
    {
      name: "Spotify",
      url: "https://open.spotify.com/search/" + encodedText,
    },
  ];

  if (fromLang !== "nl")
    items.unshift({
      name:
        (await translateBiggerTexts(text.split(' ').slice(0,10).join(' '), fromLang, "nl")) +
        ` (${fromLang.toUpperCase()})`,
      url: `https://translate.google.com/?sl=${fromLang}&tl=nl&text=${text}&op=translate`,
    });

  if(showGPT)
    items.unshift({
      name:
        "GPT: " + await chatGPT('explain: ' + text.split(' ').slice(0,1000).join(' ')),
      url: `https://chat.openai.com/`,
    });

  for (const item of items) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    if(item.url)
      a.setAttribute("href", item.url);
    if(item.func)
      a.addEventListener("click", item.func);
    
    a.setAttribute("target", "_blank");

    a.textContent = item.name;
    li.append(a);
    menu.appendChild(li);
  }

  // Add the menu to the dropdown div
  dropdown.appendChild(menu);
  
  // Add the dropdown div to the page
  document.body.appendChild(dropdown);
  
  // await (async () => new Promise((x) => setTimeout(x, 1000)))()

  if(rect.y + rect.height + 5 > window.innerHeight - dropdown.offsetHeight - 10) {
    dropdown.style.top = (window.pageYOffset + rect.y - 5 - dropdown.offsetHeight) + "px";
    styleUl = dropdown.querySelector('ul').style;
    styleUl.display = 'flex';
    styleUl.flexFlow = 'column-reverse';
  } else {
    dropdown.style.top = (window.pageYOffset + rect.y + rect.height + 5) + "px";
    styleUl = dropdown.querySelector('ul').style;
    styleUl.display = 'flex';
    styleUl.flexFlow = 'column';
  }
}

function langCodeToLanguageName(langCode) {
  const lib = {
    'en': 'English',
    'nl': 'Dutch',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'es': 'Spanish',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi'
  }
  return lib[langCode] || langCode;
}

async function detectAndGoToYouglish(text) {
  const langCode = await detectLanguage(text);
  const url = `https://youglish.com/pronounce/${text}/${langCodeToLanguageName(langCode)}?`
  openInNewTab(url);
}

function openInNewTab(url) {
  window.open(url, '_blank').focus();
}

async function detectAndSpeak(text) {
  const langCode = await detectLanguage(text);
  console.log(langCode)
  console.log(typeof langCode)
  speak(text, langCode)
}

function speak(text, langCode) {
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = synth.getVoices().find(voice => voice.lang.split('-')[0].toLowerCase() === langCode.split('-')[0].toLowerCase());
  synth.speak(utterance);
}

function hideDropdownMenu() {
  const dropdown = document.getElementById(idDropdownMenu);
  if (!dropdown) return;
  dropdown.style.display = "none";
}

function showDropdownMenu() {
  hideDropdownMenu();
  const selection = window.getSelection();
  const text = selection.toString();
  if (text) onSelection(text);
  else hideDropdownMenu();
}

function askGPT(text) {
  if(window.location.href.indexOf('https://chat.openai.com') === 0) 
    return query(text);

  // otherwise open a new tab
  let url = new URL(`https://chat.openai.com/chat`)
  url.searchParams.set('q', encodeURIComponent(text));
  window.open(url, "_blank");
}


function query(text) {
  document.querySelector("textarea").value = decodeURIComponent(text);
  const buttons = document.querySelectorAll("button");
  if(buttons?.length > 0) {
      const sendButton = document.querySelector("#__next > div.overflow-hidden.w-full.h-full.relative > div > main > div.absolute.bottom-0.left-0.w-full.border-t.md\\:border-t-0.dark\\:border-white\\/20.md\\:border-transparent.md\\:dark\\:border-transparent.md\\:bg-vert-light-gradient.bg-white.dark\\:bg-gray-800.md\\:\\!bg-transparent.dark\\:md\\:bg-vert-dark-gradient > form > div > div.flex.flex-col.w-full.py-2.flex-grow.md\\:py-3.md\\:pl-4.relative.border.border-black\\/10.bg-white.dark\\:border-gray-900\\/50.dark\\:text-white.dark\\:bg-gray-700.rounded-md.shadow-\\[0_0_10px_rgba\\(0\\,0\\,0\\,0\\.10\\)\\].dark\\:shadow-\\[0_0_15px_rgba\\(0\\,0\\,0\\,0\\.10\\)\\] > button") 
                          || buttons[buttons.length - 1];
      sendButton.click();
  }
  document.querySelector("#__next > div.overflow-hidden.w-full.h-full.relative > div.flex.h-full.flex-1.flex-col.md\\:pl-\\[260px\\] > main > div.flex-1.overflow-hidden > div > div > button")?.click()
}