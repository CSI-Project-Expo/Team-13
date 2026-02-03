from fastapi import APIRouter, Depends, HTTPException
from app.core.security import verify_firebase_token
from app.core.firebase import db

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/profile")
def get_profile(user=Depends(verify_firebase_token)):
    uid = user["uid"]
    print(f"Fetching profile for user: {uid}")

    doc = db.collection("users").document(uid).get()

    if not doc.exists:
        print(f"User profile not found for uid: {uid}")
        raise HTTPException(status_code=404, detail="User profile not found")

    profile_data = doc.to_dict()
    print(f"Profile found: {profile_data}")
    return profile_data
