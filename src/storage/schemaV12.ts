export const schemaV12=`
CREATE TABLE business_sut_offers (
 id TEXT PRIMARY KEY, holder_id TEXT NOT NULL REFERENCES business_holders(id), project_id TEXT,
 config_json TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL,
 FOREIGN KEY(project_id,holder_id) REFERENCES business_projects(id,holder_id), UNIQUE(id,holder_id)
);
CREATE TABLE business_sut_collections (
 id TEXT PRIMARY KEY, holder_id TEXT NOT NULL REFERENCES business_holders(id), offer_id TEXT NOT NULL,
 collection_date TEXT NOT NULL, base_cents INTEGER CHECK(base_cents>=0), collected_cents INTEGER CHECK(collected_cents>=0),
 state_cents INTEGER CHECK(state_cents>=0), municipal_cents INTEGER CHECK(municipal_cents>=0),
 actor TEXT NOT NULL CHECK(actor IN ('merchant','marketplace','pending')), entry_id TEXT REFERENCES business_entries(id),
 reference TEXT NOT NULL, note TEXT NOT NULL, offer_snapshot TEXT NOT NULL, rule_version TEXT NOT NULL,
 voided_at TEXT, void_reason TEXT NOT NULL DEFAULT '',
 FOREIGN KEY(offer_id,holder_id) REFERENCES business_sut_offers(id,holder_id)
);
CREATE TABLE business_contractors (
 id TEXT PRIMARY KEY, legal_name TEXT NOT NULL, legal_reference TEXT NOT NULL,
 classification TEXT NOT NULL, notes TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX business_contractor_reference ON business_contractors(lower(trim(legal_reference)));
CREATE TABLE business_contractor_reliefs (
 id TEXT PRIMARY KEY, provider_id TEXT NOT NULL REFERENCES business_contractors(id), kind TEXT NOT NULL,
 valid_from TEXT NOT NULL, valid_to TEXT, reference TEXT NOT NULL, document_id TEXT REFERENCES documents(id),
 UNIQUE(provider_id,reference,valid_from,kind)
);
CREATE TABLE business_contractor_payments (
 sequence INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, holder_id TEXT NOT NULL REFERENCES business_holders(id),
 provider_id TEXT NOT NULL REFERENCES business_contractors(id), payment_date TEXT NOT NULL,
 services_cents INTEGER CHECK(services_cents>=0), ivu_cents INTEGER CHECK(ivu_cents>=0), reimbursed_cents INTEGER CHECK(reimbursed_cents>=0),
 actual_withheld_cents INTEGER CHECK(actual_withheld_cents>=0), actual_net_cents INTEGER CHECK(actual_net_cents>=0),
 scope TEXT NOT NULL, relief_status TEXT NOT NULL, relief_id TEXT REFERENCES business_contractor_reliefs(id),
 entry_id TEXT REFERENCES business_entries(id), note TEXT NOT NULL, calculation_json TEXT NOT NULL, provider_snapshot TEXT NOT NULL,
 voided_at TEXT, void_reason TEXT NOT NULL DEFAULT ''
);
CREATE TABLE business_obligation_records (
 id TEXT PRIMARY KEY, holder_id TEXT NOT NULL REFERENCES business_holders(id), provider_id TEXT REFERENCES business_contractors(id),
 flow TEXT NOT NULL CHECK(flow IN ('ivu','contractors')), kind TEXT NOT NULL CHECK(kind IN ('remittance','filing')),
 form TEXT NOT NULL, period TEXT NOT NULL, municipality TEXT NOT NULL DEFAULT '', scope TEXT NOT NULL, amount_cents INTEGER CHECK(amount_cents>=0),
 status TEXT NOT NULL CHECK(status IN ('pending','confirmed','not_applicable')), confirmed_date TEXT,
 reference TEXT NOT NULL, note TEXT NOT NULL, due_date TEXT, due_source TEXT NOT NULL,
 rule_version TEXT NOT NULL, voided_at TEXT, void_reason TEXT NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX business_obligation_confirmation ON business_obligation_records(holder_id,flow,kind,form,scope,coalesce(provider_id,''),reference) WHERE status='confirmed' AND reference<>'' AND voided_at IS NULL;
`;
