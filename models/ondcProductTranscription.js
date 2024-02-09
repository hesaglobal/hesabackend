const { ONDCProductCategories } = require('../db/constant')
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const ondcTranscribedProductSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User"
    },
    ondcId: {
        type: ObjectId,
        ref: "ondcs"
    },
    itemName: String,
    category: {
        type: ObjectId,
        ref: "Category"
    },
    subCategory: {
        type: ObjectId,
        ref: "SubCategory"
    },
    brandName:[String],
    EANCode:String,
    salePrice:Number,
    manufacturerName: [String], 
    manufacturerAddress: [String],
    commonNameofCommodity: [String],
    manufacturedate: {
        type: Date,
        default: new Date()
    },
    importedCountry: [String], 
    isVegetarian: {
        type:Boolean,
        default:false
    },
    ingredients: [String], 
    nutritionalInfo:[{
        name:String,
        value:String
    }],
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
    Price: Number, 
    IsSellingPriceExclusiveofGST:  {
        type:Boolean,
        default:false
    }, 
    countryOfOrigin:[String],
    maxRetailPrice: Number, 
    SGSTTaxRate: Number, 
    CGSTTaxRate: Number, 
    IGSTTaxRate: Number, 
    TotalTaxRate: Number, 
    UnitDenomination: String,
    UnitValue: String, 
    Quantity: Number, 
    Returnable:  {
        type:Boolean,
        default:false
    }, 
    bestbefore:{
        type: Date,
        default: new Date()
    },
    complaintorfeedback:String,
    marketedBy:[String],
    marketedAddress:[String],
    packSize:Number,
    pricepergram:Number,
    purchasePrice:Number,
    ReturnWindow: String, 
    SellerPickupReturn:  {
        type:Boolean,
        default:false
    }, 
    Cancellable:  {
        type:Boolean,
        default:false
    },
    CODAvailability:  {
        type:Boolean,
        default:false
    },
    Weight:Number,
    TimetoShip: String, 
    MaxSaleQuantity: Number, 
    MinSaleQuantity: Number 
}, {
    timestamps: true,
});

module.exports = {
    ondcTranscribedProductModel: mongoose.model('ondcTranscribedProduct', ondcTranscribedProductSchema),
};
