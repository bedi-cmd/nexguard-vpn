import { describe, it, expect } from "vitest";
import { regionFor } from "./vpn-data";

describe("regionFor", () => {
  it("Americas: US, CA, BR", () => {
    expect(regionFor("US")).toBe("Americas");
    expect(regionFor("ca")).toBe("Americas");
    expect(regionFor("BR")).toBe("Americas");
  });

  it("Europe: GB, DE, IT", () => {
    expect(regionFor("GB")).toBe("Europe");
    expect(regionFor("DE")).toBe("Europe");
    expect(regionFor("it")).toBe("Europe");
  });

  it("Asia: JP, SG, IN", () => {
    expect(regionFor("JP")).toBe("Asia");
    expect(regionFor("SG")).toBe("Asia");
    expect(regionFor("IN")).toBe("Asia");
  });

  it("Oceania: AU, NZ", () => {
    expect(regionFor("AU")).toBe("Oceania");
    expect(regionFor("NZ")).toBe("Oceania");
  });

  it("Africa: ZA, EG, NG", () => {
    expect(regionFor("ZA")).toBe("Africa");
    expect(regionFor("EG")).toBe("Africa");
    expect(regionFor("ng")).toBe("Africa");
  });

  it("falls back to Other for unknown codes", () => {
    expect(regionFor("XX")).toBe("Other");
    expect(regionFor("ZZ")).toBe("Other");
  });
});
