const constructHeaders = (isJson: boolean): HeadersInit => {
    const headers: HeadersInit = { Authorization: "Bearer " + process.env.KV_ACCESS_KEY }    
    
    if (isJson) {
        headers["content-type"] = "application/json"
    }
    
    return headers
}

export const set = async (key: string, value: any, isJson: boolean = false) => {
  await fetch("https://kv-orcin.vercel.app/api/store/" + key, {
    method: "POST",
    headers: constructHeaders(isJson),
    body: value,
  });
};

export const get = async (key: string): Promise<string | null> => {
  const response = await fetch("https://kv-orcin.vercel.app/api/store/" + key, {
    headers: {
      Authorization: "Bearer " + process.env.KV_ACCESS_KEY,
    },
  });

  if (response.ok) {
    const json = await response.json();

    return json.value as string;
  } else {
    return null;
  }
};
