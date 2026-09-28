// Canned parse of public/demo/receipt-sample.jpg (family of 7, one infant, full quota).
// Used by the "Use sample receipt" button and whenever no parser is available.
import { currentMonth } from "@/lib/format";
import type { ParsedReceipt } from "@/lib/receipt/types";

export function sampleReceiptParse(now: Date = new Date()): ParsedReceipt {
  return {
    store: "جمعية السالمية التعاونية — فرع التموين",
    date: `${currentMonth(now)}-03`,
    lines: [
      { raw_text: "أرز بسمتي 5 كجم ×7", item_id: "rice", qty: 35, unit: "kg", unit_price: 0.12, confidence: 0.97 },
      { raw_text: "سكر 1 كجم ×7", item_id: "sugar", qty: 7, unit: "kg", unit_price: 0.09, confidence: 0.96 },
      { raw_text: "زيت دلال 3 لتر ×7", item_id: "oil", qty: 21, unit: "liter", unit_price: 1.05, confidence: 0.95 },
      { raw_text: "حليب نيدو 2.27 كجم ×7", item_id: "milk_powder", qty: 15.89, unit: "kg", unit_price: 1.05, confidence: 0.93 },
      { raw_text: "حليب كي دي دي 1 لتر ×42", item_id: "milk_longlife", qty: 42, unit: "liter", unit_price: 0.3, confidence: 0.94 },
      { raw_text: "معجون طماطم 135 جم ×28", item_id: "tomato_paste", qty: 28, unit: "can", unit_price: 0.27, confidence: 0.91 },
      { raw_text: "عدس 300 جم ×7", item_id: "lentils", qty: 2.1, unit: "kg", unit_price: 0.27, confidence: 0.62 },
      { raw_text: "دجاج مجمد 1 كجم ×21", item_id: "chicken", qty: 21, unit: "kg", unit_price: 0.6, confidence: 0.95 },
      { raw_text: "تمر 500 جم ×7", item_id: "dates", qty: 3.5, unit: "kg", unit_price: 0.5, confidence: 0.66 },
      { raw_text: "حليب أطفال 400 جم ×8", item_id: "infant_milk", qty: 8, unit: "can", unit_price: 0.9, confidence: 0.9 },
      { raw_text: "مغذيات أطفال ×2", item_id: "infant_food", qty: 2, unit: "can", unit_price: 0.9, confidence: 0.88 },
    ],
  };
}
