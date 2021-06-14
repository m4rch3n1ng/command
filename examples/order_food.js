import command from "@m4rch/command"

let options = [
	{
		name: "food",
		type: "select",
		prompt: "what kind of food do you want?",
		select: [ "pizza", "lasagna" ],
		next: {
			pizza: [
				{
					name: "ingredients",
					type: "multiple",
					prompt: "what ingredients do you want on your pizza?",
					select: [ "tomato sauce", "cheese", "mushrooms" ],
					default: [ "tomato sauce" ]
				}
			],
			lasagna: [
				{
					name: "vegan",
					type: "y/n",
					prompt: "do you want your lasagna to be vegan?",
					instant: true,
					default: false
				}
			]
		}
	}
]

command()
	.get(options)
	.action(({ food, ...order }) => {
		if (food == "pizza") {
			console.log(`your pizza with ${order.ingredients.join(", ")} will be ready soon.`)
		} else if (food == "lasagna") {
			console.log(`your ${order.vegan ? "vegan " : ""}lasagna will be ready soon.`)
		}
	})
	.run()
