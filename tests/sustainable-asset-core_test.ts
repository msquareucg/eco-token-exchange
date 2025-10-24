import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@hirosystems/clarinet-sdk";

describe("sustainable-asset-core contract test suite", () => {
  let accounts: Map<string, string>;
  let deployer: string;
  let authenticator1: string;
  let authenticator2: string;
  let developer1: string;
  let developer2: string;
  let buyer1: string;
  let buyer2: string;

  beforeEach(async (ctx) => {
    accounts = ctx.clarinet.accounts;
    deployer = accounts.get("deployer")!;
    authenticator1 = accounts.get("wallet_1")!;
    authenticator2 = accounts.get("wallet_2")!;
    developer1 = accounts.get("wallet_3")!;
    developer2 = accounts.get("wallet_4")!;
    buyer1 = accounts.get("wallet_5")!;
    buyer2 = accounts.get("wallet_6")!;
  });

  describe("Administrative Operations", () => {
    it("allows admin to reassign administrative control", (ctx) => {
      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "reassign-administrator",
        [Cl.principal(authenticator1)],
        deployer
      );
      
      expect(result.type).toBe(Cl.ResponseOk);
    });

    it("prevents non-admin from reassigning administrator", (ctx) => {
      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "reassign-administrator",
        [Cl.principal(authenticator1)],
        authenticator1
      );
      
      expect(result.type).toBe(Cl.ResponseErr);
    });

    it("enables admin to authorize new authenticator", (ctx) => {
      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "enlist-authenticator",
        [Cl.principal(authenticator1)],
        deployer
      );
      
      expect(result.type).toBe(Cl.ResponseOk);
    });

    it("rejects duplicate authenticator registration", (ctx) => {
      ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "enlist-authenticator",
        [Cl.principal(authenticator1)],
        deployer
      );

      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "enlist-authenticator",
        [Cl.principal(authenticator1)],
        deployer
      );

      expect(result.type).toBe(Cl.ResponseErr);
    });

    it("allows admin to remove authenticator", (ctx) => {
      ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "enlist-authenticator",
        [Cl.principal(authenticator1)],
        deployer
      );

      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "delist-authenticator",
        [Cl.principal(authenticator1)],
        deployer
      );

      expect(result.type).toBe(Cl.ResponseOk);
    });

    it("prevents non-admin from adding authenticator", (ctx) => {
      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "enlist-authenticator",
        [Cl.principal(authenticator2)],
        authenticator1
      );

      expect(result.type).toBe(Cl.ResponseErr);
    });
  });

  describe("Developer Credentialing", () => {
    beforeEach((ctx) => {
      ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "enlist-authenticator",
        [Cl.principal(authenticator1)],
        deployer
      );
    });

    it("allows authenticator to approve developer", (ctx) => {
      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "approve-developer-entity",
        [Cl.principal(developer1), Cl.stringAscii("Global Wind Initiative")],
        authenticator1
      );

      expect(result.type).toBe(Cl.ResponseOk);
    });

    it("prevents unauthorized parties from credentialing developers", (ctx) => {
      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "approve-developer-entity",
        [Cl.principal(developer1), Cl.stringAscii("Solar Expansion 2024")],
        developer2
      );

      expect(result.type).toBe(Cl.ResponseErr);
    });

    it("allows authenticator to revoke developer access", (ctx) => {
      ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "approve-developer-entity",
        [Cl.principal(developer1), Cl.stringAscii("Ocean Conservation")],
        authenticator1
      );

      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "revoke-developer-access",
        [Cl.principal(developer1)],
        authenticator1
      );

      expect(result.type).toBe(Cl.ResponseOk);
    });

    it("fails when revoking non-existent developer record", (ctx) => {
      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "revoke-developer-access",
        [Cl.principal(developer1)],
        authenticator1
      );

      expect(result.type).toBe(Cl.ResponseErr);
    });
  });

  describe("Exchange Marketplace Operations", () => {
    beforeEach((ctx) => {
      ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "enlist-authenticator",
        [Cl.principal(authenticator1)],
        deployer
      );

      ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "approve-developer-entity",
        [Cl.principal(developer1), Cl.stringAscii("Sustainable Forest Co")],
        authenticator1
      );
    });

    it("allows seller to publish marketplace offer with valid parameters", (ctx) => {
      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "publish-exchange-offer",
        [Cl.uint(1), Cl.uint(1000), Cl.uint(5000000)],
        developer1
      );

      expect(result.type).toBe(Cl.ResponseOk);
    });

    it("rejects offer with zero rate specification", (ctx) => {
      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "publish-exchange-offer",
        [Cl.uint(1), Cl.uint(500), Cl.uint(0)],
        developer1
      );

      expect(result.type).toBe(Cl.ResponseErr);
    });

    it("allows seller to withdraw active marketplace offer", (ctx) => {
      const publishResponse = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "publish-exchange-offer",
        [Cl.uint(1), Cl.uint(750), Cl.uint(3500000)],
        developer1
      );

      const offerId = publishResponse.value;

      const withdrawResult = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "withdraw-exchange-offer",
        [offerId],
        developer1
      );

      expect(withdrawResult.type).toBe(Cl.ResponseOk);
    });

    it("prevents non-seller from withdrawing offer", (ctx) => {
      const publishResponse = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "publish-exchange-offer",
        [Cl.uint(1), Cl.uint(600), Cl.uint(2800000)],
        developer1
      );

      const offerId = publishResponse.value;

      const withdrawResult = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "withdraw-exchange-offer",
        [offerId],
        buyer1
      );

      expect(withdrawResult.type).toBe(Cl.ResponseErr);
    });

    it("fails when attempting to withdraw non-existent offer", (ctx) => {
      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "withdraw-exchange-offer",
        [Cl.uint(9999)],
        developer1
      );

      expect(result.type).toBe(Cl.ResponseErr);
    });
  });

  describe("Query Functions", () => {
    it("retrieves empty token record for non-existent token id", (ctx) => {
      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "fetch-token-record",
        [Cl.uint(999)],
        deployer
      );

      expect(result.type).toBe(Cl.ResponseOk);
      expect(result.value).toBeNull();
    });

    it("retrieves empty offer record for non-existent offer id", (ctx) => {
      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "fetch-offer-record",
        [Cl.uint(888)],
        deployer
      );

      expect(result.type).toBe(Cl.ResponseOk);
      expect(result.value).toBeNull();
    });

    it("retrieves current exchange metrics", (ctx) => {
      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "query-exchange-metrics",
        [],
        deployer
      );

      expect(result.type).toBe(Cl.ResponseOk);
      const metrics = result.value;
      expect(metrics).toHaveProperty("generated-supply");
      expect(metrics).toHaveProperty("retired-supply");
      expect(metrics).toHaveProperty("traded-volume");
    });
  });

  describe("Authorization Boundary Tests", () => {
    it("denies offer publishing with consumed token id", (ctx) => {
      ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "enlist-authenticator",
        [Cl.principal(authenticator1)],
        deployer
      );

      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "publish-exchange-offer",
        [Cl.uint(1), Cl.uint(100), Cl.uint(1500000)],
        deployer
      );

      expect(result.type).toBe(Cl.ResponseErr);
    });

    it("denies offer publishing without sufficient account balance", (ctx) => {
      const result = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "publish-exchange-offer",
        [Cl.uint(50), Cl.uint(10000), Cl.uint(4000000)],
        developer1
      );

      expect(result.type).toBe(Cl.ResponseErr);
    });
  });

  describe("Contract State Consistency", () => {
    it("maintains sequence counter increments on offer creation", (ctx) => {
      ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "enlist-authenticator",
        [Cl.principal(authenticator1)],
        deployer
      );

      ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "approve-developer-entity",
        [Cl.principal(developer1), Cl.stringAscii("Tech Conservation")],
        authenticator1
      );

      const response1 = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "publish-exchange-offer",
        [Cl.uint(1), Cl.uint(200), Cl.uint(3000000)],
        developer1
      );

      const response2 = ctx.clarinet.chain.callReadOnly(
        "sustainable-asset-core",
        "publish-exchange-offer",
        [Cl.uint(2), Cl.uint(300), Cl.uint(2500000)],
        developer1
      );

      expect(response1.value).toEqual(Cl.uint(1));
      expect(response2.value).toEqual(Cl.uint(2));
    });
  });
});
