from sentence_transformers import SentenceTransformer

model = None


def _get_model() -> SentenceTransformer:
    global model
    if model is None:
        model = SentenceTransformer("all-MiniLM-L6-v2")
    return model

def generate_embedding(text: str):
    embedding = _get_model().encode(text)
    return embedding.tolist()