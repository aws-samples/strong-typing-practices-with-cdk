from random import choice

def lambda_handler(event, context):

    return choice(["rainy", "sunny", "cloudy"])
