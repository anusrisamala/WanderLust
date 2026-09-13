const Listing  = require("../models/listing");

module.exports.index = async (req, res) => {
    const { category } = req.query;
    let filter = {};
    if (category) {
        filter.category = category;
    }
    const allListings = await Listing.find(filter);
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req,res)=>{
    res.render("listings/new.ejs");
}

module.exports.showListing = async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({path: "reviews" , populate:{path: "author"}}).populate("owner");
    if(!listing){
        req.flash("error", "listing you requested for does not exist");
        return res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs",{listing});
}

module.exports.createListing = async(req,res)=>{
    // if(!req.body||!req.body.listing){
    //     throw new ExpressError(400,"Send valid data for listing"); 
    // }
    // let result = listingSchema.validate(req.body);
    // console.log(result);
    // if(result.error){
    //     throw new ExpressError(400,result.error);
    // }

    //one way is..
    //let {title,description,image,price,country,location}=req.body;
    //(or)

    let url = req.file.path;
    let filename  = req.file.filename;
    let listing = req.body.listing;
    const newListing = new Listing(listing);
    newListing.owner = req.user._id;
    newListing.image = {url, filename};

    if (newListing.location) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(newListing.location)}&format=json&limit=1`,
                {
                    headers: {
                        "User-Agent": "WanderLust-App"
                    }
                }
            );
            const data = await response.json();
            if (data && data.length > 0) {
                newListing.latitude = parseFloat(data[0].lat);
                newListing.longitude = parseFloat(data[0].lon);
            } else {
                console.log(`Geocoding failed: No coordinates found for location "${newListing.location}"`);
            }
        } catch (err) {
            console.log(`Geocoding error for location "${newListing.location}":`, err.message);
        }
    }

    await newListing.save();
    req.flash("success","New listing created!");
    res.redirect("/listings");
    //console.log(listing);
}

module.exports.renderEditForm = async (req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "listing you requested for does not exist");
       return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs",{listing, originalImageUrl});
}

module.exports.updateListing = async(req,res)=>{
    // if(!req.body.listing){
    //     throw new ExpressError(400,"Send valid data for listing"); 
    // }
    let {id} = req.params;
    let listing  = await Listing.findByIdAndUpdate(id,{...req.body.listing});

    if(typeof req.file!== "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url,filename};
        await listing.save();
    }
    req.flash("success","Listing updated!");
    res.redirect(`/listings/${id}`);
}


module.exports.destroyListing = async(req,res)=>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing deleted!");
    res.redirect("/listings");

}