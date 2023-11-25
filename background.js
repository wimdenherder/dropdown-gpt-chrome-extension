console.log('background.js loaded');

let controller;

async function getChatGPTApiKey() {
  const resp = await fetch("https://chat.openai.com/api/auth/session");
  const data = await resp.json().catch(() => ({}));
  return data.accessToken;
}

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (msg) => {
    console.log('received msg', msg);
    try {
      if(msg.question) {
        controller = new AbortController();
        const token = await getChatGPTApiKey();
        insertTextIntoGPT(msg.question, token, port, controller, msg.rewrite);
        // askGPT("explain the texts above", token, port, controller);
      }
      if(msg.abort) {
        // controller.abort();
      }
    } catch (err) {
      console.error(err)
      port.postMessage({ error: err.message })
    }
  })
})


async function insertTextIntoGPT(prompt, token, port, controller, rewrite) {
  const parts = []
  const maxPartSize = 15 * 1000
  while (prompt.length !== 0) {
    parts.push(prompt.slice(0, maxPartSize))
    prompt = prompt.slice(maxPartSize)
  }
  console.log({ parts }); // array of strings
  let messages = parts.length === 1 ?
    [{
      id: generateUUID(),
      role: "user",
      content: {
        content_type: "text",
        parts,
      },
    }]
  : parts.slice(0,1).map(prompt => ([
    {
      id: generateUUID(),
      role: "user",
      content: {
        content_type: "text",
        parts: [prompt],
      },
    },
    {
      id: generateUUID(),
      role: "assistant",
      content: {
        content_type: "text",
        parts: ["OK"],
      },
    }])).flat();
   if(messages.length > 1)
    messages = messages.concat({
        id: generateUUID(),
        role: "user",
        content: {
          content_type: "text",
          parts: ["summarize all my texts above"],
        },
      });
  console.log({messages});
  await fetchSSE("https://chat.openai.com/backend-api/conversation", {
    signal: controller.signal,
    onMessage(txt) {
      // port.postMessage({ txt });
    },
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: "next",
      messages,
      // [
      //   {
      //     id: generateUUID(),
      //     role: "user",
      //     content: {
      //       content_type: "text",
      //       parts: [prompt],
      //     },
      //   },
      // ],
      model: "text-davinci-002-render-paid", //gpt-4", // text-davinci-002-render-sha, text-davinci-002-render-paid, gpt-4
      parent_message_id: generateUUID(),
    }),
    onMessage(message) {
      console.debug("sse message", message);
      port.postMessage({ txt: message, rewrite });
      // if (message === "[DONE]") {
      //   params.onEvent({ type: "done" });
      //   cleanup();
      //   return;
      // }
      // let data;
      // // try {
      // const obj = message.slice("data: ".length);
      // console.log({ obj });
      // data = JSON.parse(obj); // after "data: " starts the object
      // // } catch (err) {
      // //   console.error(err);
      // //   return;
      // // }
      // const text = data.message?.content?.parts?.[0];
      // if (text) {
      //   conversationId = data.conversation_id;
      //   params.onEvent({
      //     type: "answer",
      //     data: {
      //       text,
      //       messageId: data.message.id,
      //       conversationId: data.conversation_id,
      //     },
      //   });
      // }`
    },
  });
}

async function askGPT(prompt, token, port, controller) {
  // port.postMessage({ txt: `...` });
  await fetchSSE("https://chat.openai.com/backend-api/conversation", {
    signal: controller.signal,
    onMessage(txt) {
      port.postMessage({ txt });
    },
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: "next",
      messages: [
        {
          id: generateUUID(),
          role: "user",
          content: {
            content_type: "text",
            parts: [prompt],
          },
        },
      ],
      model: "text-davinci-002-render-paid", //gpt-4", // text-davinci-002-render-sha, text-davinci-002-render-paid, gpt-4
      parent_message_id: generateUUID(),
    }),
    onMessage(message) {
      console.debug("sse message", message);
      port.postMessage({ txt: message });
      // if (message === "[DONE]") {
      //   params.onEvent({ type: "done" });
      //   cleanup();
      //   return;
      // }
      // let data;
      // // try {
      // const obj = message.slice("data: ".length);
      // console.log({ obj });
      // data = JSON.parse(obj); // after "data: " starts the object
      // // } catch (err) {
      // //   console.error(err);
      // //   return;
      // // }
      // const text = data.message?.content?.parts?.[0];
      // if (text) {
      //   conversationId = data.conversation_id;
      //   params.onEvent({
      //     type: "answer",
      //     data: {
      //       text,
      //       messageId: data.message.id,
      //       conversationId: data.conversation_id,
      //     },
      //   });
      // }`
    },
  });
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function fetchSSE(
  resource,
  options
) {
  const { onMessage, ...fetchOptions } = options
  const resp = await fetch(resource, fetchOptions)
  if (!resp.ok) {
    const error = await resp.json().catch(() => ({}))
    throw new Error(JSON.stringify(error))
  }
  const parser = createParser(onMessage);
  for await (const chunk of streamAsyncIterable(resp.body)) {
    const str = new TextDecoder().decode(chunk)
    console.log('str', str);
    parser.feed(str);
  }
}

async function* streamAsyncIterable(stream) {
  const reader = stream.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        return
      }
      yield value
    }
  } finally {
    reader.releaseLock()
  }
}

function createParser(callback) {
  var parser = {
    buffer: "",
    parse: function (data) {
      this.buffer += data;
      var lines = this.buffer.split("\n");
      var events = [];

      for (var i = 0; i < lines.length - 1; i++) {
        var line = lines[i];
        if (line.startsWith("data: ")) {
          let newObj;
          try {
            newObj = JSON.parse(line.slice(6));
          } catch (err) {}
          if(data)
            events.push(newObj);
        }
      }

      this.buffer = lines[lines.length - 1];
      return events;
    },
    feed: function (data) {
      var events = this.parse(data);
      console.log('events', events)
      for (var i = 0; i < events.length; i++) {
        const message = events[i]?.message?.content?.parts?.join("\n");
        console.log({message})
        callback(message);
      }
    }
  };

  return parser;
}