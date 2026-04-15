from fastapi import APIRouter , Depends , HTTPException


router = APIRouter()

@router.post("login")
def login(email : str , password : str , db=Depends(get_db)):
    
    pass