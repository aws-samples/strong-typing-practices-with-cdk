from random import choices

def lambda_handler(event, context):

    weather = event.get("weather")
    clouds  = event.get("clouds")

    if not clouds:
        clouds = []

    if not weather:
        clouds.append("someone stole the weather")
    elif weather == "sunny":
        happy_clouds = choices(["fluffy rabbit", "puffy dove", "shaggy terrier"])[0]
        clouds.append(happy_clouds)
    elif weather == "cloudy":
        big_clouds = choices(["cumulonimbus whale", "trumpeting elephant", "speedy ostrich"])[0]
        clouds.append(big_clouds)
    else:
        clouds.append("dark and cloudless days")

    return clouds
