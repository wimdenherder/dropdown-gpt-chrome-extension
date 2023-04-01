function query(text) {
  document.querySelector("textarea").value = decodeURIComponent(text);
  const buttons = document.querySelectorAll("button");
  console.log({buttons})
  if(buttons?.length > 0) {
      const sendButton = document.querySelector("#__next > div.overflow-hidden.w-full.h-full.relative > div > main > div.absolute.bottom-0.left-0.w-full.border-t.md\\:border-t-0.dark\\:border-white\\/20.md\\:border-transparent.md\\:dark\\:border-transparent.md\\:bg-vert-light-gradient.bg-white.dark\\:bg-gray-800.md\\:\\!bg-transparent.dark\\:md\\:bg-vert-dark-gradient > form > div > div.flex.flex-col.w-full.py-2.flex-grow.md\\:py-3.md\\:pl-4.relative.border.border-black\\/10.bg-white.dark\\:border-gray-900\\/50.dark\\:text-white.dark\\:bg-gray-700.rounded-md.shadow-\\[0_0_10px_rgba\\(0\\,0\\,0\\,0\\.10\\)\\].dark\\:shadow-\\[0_0_15px_rgba\\(0\\,0\\,0\\,0\\.10\\)\\] > button") 
                          || buttons[buttons.length - 1];
      sendButton.disabled = false;
      sendButton.click();
  }
  document.querySelector("#__next > div.overflow-hidden.w-full.h-full.relative > div.flex.h-full.flex-1.flex-col.md\\:pl-\\[260px\\] > main > div.flex-1.overflow-hidden > div > div > button")?.click()
}

async function onload() {
  let timeout = 0;
  const noMachineCheck = document.querySelector("#cf-stage > div.ctp-checkbox-container > label > span");
  if(noMachineCheck) {
    noMachineCheck.click();
    timeout = 500;
  }

  await (async () => new Promise((x) => setTimeout(x, 500)))();

  (document.querySelector("#headlessui-listbox-button-\\:r0\\:") || 
   document.querySelector("#headlessui-listbox-button-\\:r6\\:"))?.click();

  await (async () => new Promise((x) => setTimeout(x, 100)))();

  (
    document.querySelector("#headlessui-listbox-button-\\:r0\\:") ||
    document.querySelector("#headlessui-listbox-button-\\:r6\\:")
  )?.parentNode
    .querySelector("ul>li:nth-of-type(3)")
    ?.click();

  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  if(!params.q) return;
  
  setTimeout(() => {
    query(params.q)
  }, timeout);
}

onload();