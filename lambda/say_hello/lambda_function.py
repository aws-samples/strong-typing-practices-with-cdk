def lambda_handler(event, context):

    name = event.get("name")
    if not name:
        name = "person who does not want to give their name"

    return { "hello": f"hello {name}"}
