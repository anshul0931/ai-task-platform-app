"""
Worker operations — must match the four operations required by the spec:
Uppercase, Lowercase, Reverse String, Word Count.
"""


def _uppercase(input_text: str) -> dict:
    return {"output": input_text.upper()}


def _lowercase(input_text: str) -> dict:
    return {"output": input_text.lower()}


def _reverse_string(input_text: str) -> dict:
    return {"output": input_text[::-1]}


def _word_count(input_text: str) -> dict:
    words = input_text.split()
    return {"output": len(words), "words": len(words)}


OPERATIONS = {
    "uppercase": _uppercase,
    "lowercase": _lowercase,
    "reverse-string": _reverse_string,
    "word-count": _word_count,
}


def process_task(operation: str, input_text: str) -> dict:
    handler = OPERATIONS.get(operation)
    if not handler:
        raise ValueError(f"Unsupported operation: {operation}")
    if input_text is None or input_text == "":
        raise ValueError("inputText is required")
    return handler(input_text)
