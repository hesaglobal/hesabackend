const mongoose = require('mongoose');
const itemSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    status: {
        type: Boolean,
        default: true
    },
    name: String,
    category: {
        type: ObjectId,
        ref: "Category"
    },
    subCategory: {
        type: ObjectId,
        ref: "SubCategory"
    },
    productId:String,
    units: String,
    salePrice: Number,
    displayPrice: Number,
    purchasePrice: Number,
    HSNCode: String,
    GSTRate: Number,
    manufacturerName: [String],
    manufacturerAddress: [String],
    commonNameofCommodity: [String],
    manufacturedate: {
        type: Date,
        default: new Date()
    },
    ondcId: {
        type: ObjectId,
        ref: "ondcs"
    },
    importedCountry: [String],
    isVegetarian: {
        type: Boolean,
        default: false
    },
    ingredients: [String],
    brandOwnerName: [String],
    brandOwnerAddress: [String],
    brandOwnerFSSAILicenseNo: [String],
    otherFSSAILicenseNo: [String],
    importerName: [String],
    importerAddress: [String],
    importerFSSAILicenseNo: [String],
    importedCountryofOrigin: [String],
    otherImporterName: [String],
    otherImporterAddress: [String],
    otherPremises: [String],
    otherImporterCountryofOrigin: [String],
    IsSellingPriceExclusiveofGST: {
        type: Boolean,
        default: false
    },
    SGSTTaxRate: Number,
    CGSTTaxRate: Number,
    IGSTTaxRate: Number,
    UnitDenomination: String,
    Returnable: {
        type: Boolean,
        default: false
    },
    ReturnWindow: String,
    SellerPickupReturn: {
        type: Boolean,
        default: false
    },
    Cancellable: {
        type: Boolean,
        default: false
    },
    CODAvailability: {
        type: Boolean,
        default: false
    },
    TimetoShip: String,
    MaxSaleQuantity: Number,
    MinSaleQuantity: Number,
    bestbefore: {
        type: Date,
        default: new Date()
    },
    complaintorfeedback:String,
    countryOfOrigin: [String],
    Quantity: Number,
    pricepergram: Number,
    Weight: Number,
    brandName: [String],
    EANCode: String,
    marketedBy: [String],
    marketedAddress: [String],
    packSize: Number,
    maxRetailPrice: Number,
    UnitValue: String,
    image: String,
    description: String
},
    {
        timestamps: true,
    }
)

module.exports = {
    itemModel: mongoose.model('items', itemSchema),
};
