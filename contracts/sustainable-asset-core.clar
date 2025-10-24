;; sustainable-asset-core.clar
;; Eco-Token Exchange Core Contract
;; Manages the complete lifecycle of ecological tokens including issuance, registry,
;; marketplace operations, and permanent retirement mechanisms. This contract establishes
;; a decentralized infrastructure for exchanging verified environmental offset tokens
;; on the Stacks blockchain network.

;; ========== Error Definitions ==========

(define-constant fail-unauthorized (err u100))
(define-constant fail-invalid-authenticator (err u101))
(define-constant fail-already-active (err u102))
(define-constant fail-not-found-in-registry (err u103))
(define-constant fail-developer-not-authorized (err u104))
(define-constant fail-token-id-invalid (err u105))
(define-constant fail-duplicate-token (err u106))
(define-constant fail-balance-insufficient (err u107))
(define-constant fail-already-consumed (err u108))
(define-constant fail-offer-missing (err u109))
(define-constant fail-rate-invalid (err u110))
(define-constant fail-offer-exists (err u111))
(define-constant fail-not-seller (err u112))
(define-constant fail-settlement-blocked (err u113))

;; ========== Core Configuration ==========

;; Primary administrative authority for protocol governance
(define-data-var primary-administrator principal tx-sender)

;; Certifying entity registry - authorized to validate developers
(define-map authenticator-registry
  principal
  bool
)

;; Developer validation state - connected to their certifying entity
(define-map developer-credentials
  {
    entity: principal,
    authenticator: principal,
  }
  {
    valid: bool,
    registration-height: uint,
    initiative-label: (string-ascii 100),
  }
)

;; Environmental token metadata and ownership tracking
(define-map token-repository
  { token-id: uint }
  {
    custodian: principal,
    initiator: principal,
    quantity: uint, ;; in standardized units
    scheme-category: (string-ascii 50),
    location-identifier: (string-ascii 50),
    certification-framework: (string-ascii 50),
    epoch-year: uint,
    credential-identifier: (string-ascii 100),
    minted-at: uint,
    consumed: bool,
    consumption-recipient: (optional principal),
    consumption-timestamp: (optional uint),
  }
)

;; Account distribution ledger - balances per user and token
(define-map portfolio-ledger
  {
    custodian: principal,
    token-id: uint,
  }
  {
    available-balance: uint,
    consumed-balance: uint,
  }
)

;; Exchange platform offers - represents active sell orders
(define-map exchange-offers
  { offer-id: uint }
  {
    merchant: principal,
    token-id: uint,
    quantity: uint,
    rate-per-unit: uint,
    is-active: bool,
  }
)

;; Token issuance counter
(define-data-var token-sequence uint u1)

;; Offer sequence counter
(define-data-var offer-sequence uint u1)

;; Exchange metrics
(define-data-var aggregate-tokens-generated uint u0)
(define-data-var aggregate-tokens-consumed uint u0)
(define-data-var aggregate-volume-exchanged uint u0)

;; ========== Internal Verification Functions ==========

;; Validate caller is contract administrator
(define-private (check-is-administrator)
  (is-eq tx-sender (var-get primary-administrator))
)

;; Validate principal has authenticator status
(define-private (check-authenticator-status (principal-to-check principal))
  (default-to false (map-get? authenticator-registry principal-to-check))
)

;; Validate developer credentials with current caller as authenticator
(define-private (check-developer-validity (dev principal))
  (match (map-get? developer-credentials {
    entity: dev,
    authenticator: tx-sender,
  })
    record-data (get valid record-data)
    false
  )
)

;; Check if token exists and is not consumed
(define-private (check-token-usable (tid uint))
  (match (map-get? token-repository { token-id: tid })
    record-data (not (get consumed record-data))
    false
  )
)

;; Verify user holds sufficient unconsumed tokens
(define-private (check-account-balance
    (holder principal)
    (tid uint)
    (amount uint)
  )
  (match (map-get? portfolio-ledger {
    custodian: holder,
    token-id: tid,
  })
    account-data (>= (get available-balance account-data) amount)
    false
  )
)

;; ========== Query Functions ==========

;; Retrieve complete token details by identifier
(define-read-only (fetch-token-record (tid uint))
  (map-get? token-repository { token-id: tid })
)

;; Retrieve exchange offer by identifier
(define-read-only (fetch-offer-record (oid uint))
  (map-get? exchange-offers { offer-id: oid })
)

;; Query current exchange metrics
(define-read-only (query-exchange-metrics)
  {
    generated-supply: (var-get aggregate-tokens-generated),
    retired-supply: (var-get aggregate-tokens-consumed),
    traded-volume: (var-get aggregate-volume-exchanged),
  }
)

;; ========== Administrative Operations ==========

;; Reassign primary administrative control
(define-public (reassign-administrator (new-principal principal))
  (begin
    (asserts! (check-is-administrator) fail-unauthorized)
    (var-set primary-administrator new-principal)
    (ok true)
  )
)

;; Authorize new verification entity
(define-public (enlist-authenticator (entity principal))
  (begin
    (asserts! (check-is-administrator) fail-unauthorized)
    (asserts! (not (check-authenticator-status entity)) fail-already-active)
    (map-set authenticator-registry entity true)
    (ok true)
  )
)

;; Remove verification entity authorization
(define-public (delist-authenticator (entity principal))
  (begin
    (asserts! (check-is-administrator) fail-unauthorized)
    (asserts! (check-authenticator-status entity) fail-not-found-in-registry)
    (map-delete authenticator-registry entity)
    (ok true)
  )
)

;; ========== Developer Lifecycle Functions ==========

;; Approve developer by certifying entity
(define-public (approve-developer-entity
    (developer principal)
    (initiative-label (string-ascii 100))
  )
  (begin
    (asserts! (check-authenticator-status tx-sender) fail-unauthorized)
    (map-set developer-credentials {
      entity: developer,
      authenticator: tx-sender,
    } {
      valid: true,
      registration-height: block-height,
      initiative-label: initiative-label,
    })
    (ok true)
  )
)

;; Revoke developer approval
(define-public (revoke-developer-access (developer principal))
  (begin
    (asserts! (check-authenticator-status tx-sender) fail-unauthorized)
    (match (map-get? developer-credentials {
      entity: developer,
      authenticator: tx-sender,
    })
      existing-record (begin
        (map-set developer-credentials {
          entity: developer,
          authenticator: tx-sender,
        }
          (merge existing-record { valid: false })
        )
        (ok true)
      )
      fail-not-found-in-registry
    )
  )
)

;; ========== Exchange Marketplace Functions ==========

;; Create public marketplace offer
(define-public (publish-exchange-offer
    (tid uint)
    (quantity uint)
    (rate-per-unit uint)
  )
  (let (
      (merchant tx-sender)
      (oid (var-get offer-sequence))
    )
    (asserts! (check-token-usable tid) fail-already-consumed)
    (asserts! (check-account-balance merchant tid quantity)
      fail-balance-insufficient
    )
    (asserts! (> rate-per-unit u0) fail-rate-invalid)
    ;; Write offer to exchange
    (map-set exchange-offers { offer-id: oid } {
      merchant: merchant,
      token-id: tid,
      quantity: quantity,
      rate-per-unit: rate-per-unit,
      is-active: true,
    })
    ;; Increment offer counter
    (var-set offer-sequence (+ oid u1))
    (ok oid)
  )
)

;; Deactivate exchange offer
(define-public (withdraw-exchange-offer (oid uint))
  (let ((offer-record (unwrap! (map-get? exchange-offers { offer-id: oid })
      fail-offer-missing
    )))
    (asserts! (is-eq tx-sender (get merchant offer-record)) fail-not-seller)
    (asserts! (get is-active offer-record) fail-offer-missing)
    ;; Mark offer as inactive
    (map-set exchange-offers { offer-id: oid }
      (merge offer-record { is-active: false })
    )
    (ok true)
  )
)
