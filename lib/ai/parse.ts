/** Extract the JSON object from a model reply that may carry code fences or
 *  surrounding prose. Pure — unit-tested without any SDK. */
export const parseJson = (t: string) => {
  const c = t.replace(/```json|```/g, "").trim();
  return JSON.parse(c.slice(c.indexOf("{"), c.lastIndexOf("}") + 1));
};
