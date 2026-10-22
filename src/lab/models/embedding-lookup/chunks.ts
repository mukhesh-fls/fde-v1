/** Kestrel Travel policy chunks for the embedding model, grouped by topic. Short, plain and realistic. */

export type Topic = "refunds" | "baggage" | "changes" | "documents" | "loyalty" | "assistance";

export const TOPICS: { id: Topic; label: string }[] = [
  { id: "refunds", label: "Refunds" },
  { id: "baggage", label: "Baggage" },
  { id: "changes", label: "Booking changes" },
  { id: "documents", label: "Visas & documents" },
  { id: "loyalty", label: "Loyalty points" },
  { id: "assistance", label: "Special assistance" },
];

export type Chunk = { id: string; topic: Topic; text: string };

export const CHUNKS: Chunk[] = [
  { id: "R1", topic: "refunds", text: "Cancelled flights get a full refund to the original card within seven days." },
  { id: "R2", topic: "refunds", text: "Non-refundable fares can be converted to travel credit valid for one year." },
  { id: "R3", topic: "refunds", text: "Refunds for partly used tickets cover the unused flights minus fees." },
  { id: "R4", topic: "refunds", text: "Reimbursement for meals during long delays needs the original receipts." },
  { id: "R5", topic: "refunds", text: "Taxes and airport charges are returned even on non-refundable fares." },
  { id: "R6", topic: "refunds", text: "Refund status can be tracked in the app under My trips." },
  { id: "R7", topic: "refunds", text: "Duplicate card charges are reversed by the payments team in three days." },
  { id: "R8", topic: "refunds", text: "Compensation for delays over three hours is paid as a voucher or cash." },
  { id: "B1", topic: "baggage", text: "Delayed luggage is delivered to your address free of charge." },
  { id: "B2", topic: "baggage", text: "Report a missing suitcase at the arrivals desk before leaving the airport." },
  { id: "B3", topic: "baggage", text: "Damaged luggage claims must be filed within seven days of arrival." },
  { id: "B4", topic: "baggage", text: "Each passenger may carry one cabin bag up to seven kilograms." },
  { id: "B5", topic: "baggage", text: "Checked baggage allowance is fifteen kilograms on domestic routes." },
  { id: "B6", topic: "baggage", text: "Extra luggage can be bought online cheaper than at the counter." },
  { id: "B7", topic: "baggage", text: "Sports equipment and musical instruments need advance booking." },
  { id: "B8", topic: "baggage", text: "Lost property found on board is kept for thirty days." },
  { id: "C1", topic: "changes", text: "You can move your flight to a new date in the app up to two hours before departure." },
  { id: "C2", topic: "changes", text: "Date changes cost a fee plus any difference in fare." },
  { id: "C3", topic: "changes", text: "Name corrections of up to three letters are free." },
  { id: "C4", topic: "changes", text: "Rebooking after a cancellation by Kestrel is always free." },
  { id: "C5", topic: "changes", text: "Booking REF-2041 style references have six characters and appear on your ticket email." },
  { id: "C6", topic: "changes", text: "Upgrades to business class can be requested at check-in." },
  { id: "C7", topic: "changes", text: "Seat selection can be changed until online check-in closes." },
  { id: "C8", topic: "changes", text: "Group bookings of ten or more need the groups desk for changes." },
  { id: "D1", topic: "documents", text: "Indian passport holders need a visa for Singapore unless in transit under 96 hours." },
  { id: "D2", topic: "documents", text: "Passports must be valid for six months beyond the travel date." },
  { id: "D3", topic: "documents", text: "Domestic flights accept Aadhaar, passport or driving licence as ID." },
  { id: "D4", topic: "documents", text: "E-visas must be printed or shown on a phone at check-in." },
  { id: "D5", topic: "documents", text: "Minors travelling alone need a signed consent form from a parent." },
  { id: "D6", topic: "documents", text: "Transit passengers in Dubai may need a transit visa depending on nationality." },
  { id: "D7", topic: "documents", text: "Boarding is refused without valid travel documents, with no refund." },
  { id: "D8", topic: "documents", text: "Check entry rules on the embassy website before you book." },
  { id: "L1", topic: "loyalty", text: "Kestrel Miles are earned on every paid flight based on distance." },
  { id: "L2", topic: "loyalty", text: "Miles expire after eighteen months without activity." },
  { id: "L3", topic: "loyalty", text: "Gold members get priority boarding and an extra checked bag." },
  { id: "L4", topic: "loyalty", text: "Missing miles can be claimed up to six months after the flight." },
  { id: "L5", topic: "loyalty", text: "Points can pay for seat upgrades and lounge access." },
  { id: "L6", topic: "loyalty", text: "Family pooling lets up to five members share miles." },
  { id: "L7", topic: "loyalty", text: "Partner hotel stays also earn Kestrel Miles." },
  { id: "L8", topic: "loyalty", text: "Status tiers are reviewed every year in April." },
  { id: "A1", topic: "assistance", text: "Wheelchair assistance is free and can be requested up to 48 hours before departure." },
  { id: "A2", topic: "assistance", text: "Passengers who are pregnant beyond 32 weeks need a doctor's letter." },
  { id: "A3", topic: "assistance", text: "Service animals travel in the cabin with prior approval." },
  { id: "A4", topic: "assistance", text: "Special meals such as Jain or diabetic must be ordered 24 hours ahead." },
  { id: "A5", topic: "assistance", text: "Passengers with reduced mobility board first." },
  { id: "A6", topic: "assistance", text: "Medical oxygen on board needs a form from your doctor." },
  { id: "A7", topic: "assistance", text: "Unaccompanied children aged five to twelve are escorted by staff." },
  { id: "A8", topic: "assistance", text: "Hearing assistance is available at every Kestrel gate." },
];

export const QUERY_PRESETS = [
  "I want my money back",
  "my bag never arrived",
  "change my flight date",
  "do I need a visa for Singapore",
  "booking REF-2041",
];
