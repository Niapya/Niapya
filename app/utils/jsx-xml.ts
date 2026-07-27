import { Fragment, type RemixElement, type RemixNode } from "remix/ui";

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const XML_NAME = /^[A-Za-z_][A-Za-z0-9_.-]*(?::[A-Za-z_][A-Za-z0-9_.-]*)?$/;

type XmlIntrinsicProps = {
  children?: RemixNode;
  [attribute: string]: unknown;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      channel: XmlIntrinsicProps;
      changefreq: XmlIntrinsicProps;
      description: XmlIntrinsicProps;
      guid: XmlIntrinsicProps;
      item: XmlIntrinsicProps;
      language: XmlIntrinsicProps;
      lastBuildDate: XmlIntrinsicProps;
      lastmod: XmlIntrinsicProps;
      loc: XmlIntrinsicProps;
      priority: XmlIntrinsicProps;
      pubDate: XmlIntrinsicProps;
      rss: XmlIntrinsicProps;
      url: XmlIntrinsicProps;
      urlset: XmlIntrinsicProps;
    }
  }
}

/** Serializes a Remix JSX tree as an XML document with escaped text and attributes. */
export function buildXml(node: RemixNode): string {
  return `${XML_DECLARATION}\n${serializeNode(node)}`;
}

function serializeNode(node: RemixNode): string {
  if (Array.isArray(node)) return node.map(serializeNode).join("");
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "bigint") {
    return escapeXml(String(node));
  }
  if (typeof node === "number") {
    if (!Number.isFinite(node)) {
      throw new TypeError("XML text cannot contain a non-finite number");
    }
    return String(node);
  }
  if (!isRemixElement(node)) {
    throw new TypeError("XML children must be JSX elements or scalar values");
  }
  if (node.type === Fragment) return serializeNode(node.props.children);
  if (typeof node.type !== "string") {
    throw new TypeError("XML JSX does not support component elements");
  }

  assertXmlName(node.type, "element");
  const { children, ...props } = node.props;
  const attributes = Object.entries(props).flatMap(([name, value]) => {
    if (value === null || value === undefined) return [];
    assertXmlName(name, "attribute");
    return [` ${name}="${escapeXml(xmlAttributeValue(value))}"`];
  }).join("");

  return `<${node.type}${attributes}>${serializeNode(children)}</${node.type}>`;
}

function isRemixElement(node: object): node is RemixElement {
  return "$rmx" in node && node.$rmx === true;
}

function xmlAttributeValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  throw new TypeError("XML attributes must be scalar values");
}

function assertXmlName(name: string, kind: "attribute" | "element"): void {
  if (!XML_NAME.test(name)) {
    throw new TypeError(`Invalid XML ${kind} name: ${name}`);
  }
}

function escapeXml(value: string): string {
  return replaceInvalidXmlCharacters(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function replaceInvalidXmlCharacters(value: string): string {
  let result = "";

  for (const character of value.toWellFormed()) {
    const codePoint = character.codePointAt(0)!;
    const isValid = codePoint === 0x9 || codePoint === 0xA ||
      codePoint === 0xD ||
      (codePoint >= 0x20 && codePoint <= 0xD7FF) ||
      (codePoint >= 0xE000 && codePoint <= 0xFFFD) ||
      (codePoint >= 0x10000 && codePoint <= 0x10FFFF);
    result += isValid ? character : "\uFFFD";
  }

  return result;
}
