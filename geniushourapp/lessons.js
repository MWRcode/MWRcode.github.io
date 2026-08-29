import { setTitle, setEditor, newParagraph, newList, newTable, newCodeBlock, setupPython } from "./code.js";

const params = new URLSearchParams(window.location.search);
const lessonNumber = params.get("lesson");

if (lessonNumber == 1) {
    setTitle("Output", 1);

    newParagraph(`Let's start off simple with simple line of Python:`);
    newCodeBlock(`print("Hello World")`);
    newParagraph(`You may not understand what all of it does yet, but you will. This program outputs the phrase, "Hello World" to the console.`);
    newParagraph(`The "print" keyword specifies a function. The parentheses specify the parameters to the function. The quotation marks specify a text input. And the input is: "Hello World". Anything written in the quotation marks will be outputted when the program runs.`)
    newParagraph(`Try writing your own message!`);
} else if (lessonNumber == 2) {
    setTitle("Types", 2);

    newParagraph(`When programming you will need to use different types of data. For example:`);
    newList([`Numbers`, `Text`, `Lists`, `Booleans`]);
    newParagraph(`In Python these types are assigned based on how you write your data.`);
    newParagraph(`You already know about one type, a string. The string type contains text and is denoted by quotation marks. Strings look like this:`);
    newCodeBlock(`"This is a string!"`);
    newParagraph(`Another type you should know about is a number. A number needs no extra descriptors and is simply a number. Numbers look like this:`);
    newCodeBlock(`123`);
    newParagraph(`One more type to know is a list. A list is created with brackets and can contain multiple types of data separated by commas A list looks like this:`);
    newCodeBlock(`["This is the first item", 49, 2, "This is the last item"]`);
    newParagraph(`All of these types can be outputted or printed to the console. Try it yourself!`);
} else if (lessonNumber == 3) {
    setTitle("Variables", 3);

    newParagraph(`When assigning variables you need a name and data. Variables are assigned using the equals sign. For example, this program sets a variable named "a" to the value of 85.`);
    newCodeBlock(`a = 10`);
    newParagraph(`Variables can be assigned any type. For example:`);
    newCodeBlock(`b = "This is a string."`);
    newParagraph(`Variables can also be assigned other variables. For example:`);
    newCodeBlock(`a = 20\na = a`);
    newParagraph(`Note that variable names can be as long as you want and do not have to be single letters. Variables names can also contain letters, as long as the first character is a letter. These are both valid variable names:`);
    newCodeBlock(`Var = "Hello"\nk1 = "Hi"`);
    newParagraph(`Try writing your own variables!`);
} else if (lessonNumber == 4) {
    setTitle("Operators", 4);

    newParagraph(`Operators are simple, built-in mathematical operations that can be used on numbers. For example, this expression sets "a" to 4 + 9:`);
    newCodeBlock(`a = 4 + 9`);
    newParagraph(`The built-in operators include:`);

    newTable(["Name", "Symbol", "Operation"], [
        ["Add", "+", "Adds two numbers."],
        ["Subtract", "-", "Subtracts two numbers."],
        ["Multiply", "*", "Multiplies two numbers."],
        ["Divide", "/", "Divides two numbers."],
        ["Parentheses", "()", "Evaluates contained expressions separate from the surrounding expression."],
        ["Exponent", "**", "Raises one number to the power of another."]
    ]);

    newParagraph(`When dealing with multiple operators, Python will evaluate them in PEMDAS order. This order is:`);

    newList([
        "All expressions inside parentheses",
        "Exponents",
        "Multiplication and division from left to right",
        "Addition and subtraction from left to right"
    ], "numbered");

    newParagraph(`For example this prints 16:`);
    newCodeBlock(`print(10 + 3 * 4 / (0.5 + 1.5))`);
    newParagraph(`Try writing your own expressions!`);

    setEditor(`print(10 + 3 * 4 / (0.5 + 1.5))`);
} else if (lessonNumber == 5) {
    setTitle("Booleans", 5);

    newParagraph(`Booleans are a special type that only have two values, true or false. For example, these are booleans:`);
    newCodeBlock(`a = True\nb = False`);
    newParagraph(`Booleans can be created by comparisons between values. Python includes built-in symbols for comparison, these symbols are:`);

    newTable(["Name", "Symbol", "Condition"], [
        ["Greater than", ">", "If a number is greater than another."],
        ["Less than", "<", "If a number is less than another."],
        ["Greater than or equal to", ">=", "If a number is greater than or equal to another."],
        ["Less than or equal to", ">=", "If a number is less than or equal to another."],
        ["Equal to", "==", "If a number is equal to another."],
        ["Not equal to", "!=", "If a number is unequal to another."]
    ]);

    newParagraph(`These symbols output a boolean depending on whether the statement is true or false. For example this prints true:`);
    newCodeBlock(`print(7 > 2)`);
    newParagraph(`And this prints false:`);
    newCodeBlock(`print(1 == 4)`);
    newParagraph(`Try writting your own boolean comparisons!`);
} else if (lessonNumber == 6) {
    setTitle("Boolean Logic", 6);

    newParagraph(`Single booleans are not that useful, so we combine them with boolean logic. Booleans can be combined with certain boolean logic expressions. For example:`);
    newCodeBlock(`a = 4 > 0\nb = 1 < 9\nc = a and b\nprint(c)`);
    newParagraph(`This program prints true if "a" and "b" are both true.`);
    newParagraph(`The "and" operation is an example of a built-in boolean operation. The built-in boolean operations include:`);

    newTable(["Name", "Program Name", "Operation"], [
        ["And", "and", "Returns true if both inputs are true."],
        ["Or", "or", "Returns true if at least one input is true."],
        ["Not", "not", "Returns the opposite of the input."]
    ]);

    newParagraph(`*Note that the "not" operation is special because it only takes one input.`);
    newParagraph(`For example this prints true:`);
    newCodeBlock(`a = False\nprint(not a)`);
    newParagraph(`Try writting your own boolean logic expressions!`);
} else if (lessonNumber == 7) {
    setTitle("Conditionals", 7);

    newParagraph(`A conditional statement uses booleans to control the flow of a program.`);
    newParagraph(`The built-in conditional statements are:`);

    newTable(["Name", "Program name", "Action"], [
        ["If", "if", "Executes the contained code if the boolean input is true."],
        ["Else", "else", "Executes the contained code if the previous conditional statement was false."],
        ["Else if", "elif", "Executes the contained code if the previous conditional statement was false and the boolean input is true."]
    ]);

    newParagraph(`*It is important to note that a "else" or "elif" can only come after an "if"`);
    newParagraph(`For example this program prints "Hi" if "a" is 1, "Bye" if "a" is 2, and "Goodbye" if "a" is neither 1 nor 2:`);
    newCodeBlock(`if a == 1:\n    print("Hi")\nelif a == 2:\n    print("Bye")\nelse:\n    print("Goodbye")`);
    newParagraph(`It is important to note that a conditional statement must end with a colon and have indentation* on the code that is inside of it.`);
    newParagraph(`*This indentation can be either the tab character or a number of spaces that is consistent across the whole program.`);
    newParagraph(`Try writting your own conditonal statements!`);
} else if (lessonNumber == 8) {
    setTitle("Functions", 8);

    newParagraph(`Functions are blocks of code that have an input, process it, and output new data. Function can be both called and defined.`);
    newParagraph(`When a function is called it uses parentheses to specify inputs. For example we have used the built-in "print" function to output data.`);
    newParagraph(`Functions can also be created in a program. In Python, functions are created with the "def" keyword, which is short for define. A Python function would look like this:`);
    newCodeBlock(`def add(a, b):\n    return a + b\n\nprint(add(1, 4))`);
    newParagraph(`This function prints 5.`);
    newParagraph(`The parentheses in the definition contain the names of the variables that the inputs will be assigned to. This means that when the function is called a variable, "a", is created and set to the value of the first input. And a variable, "b", is set to the value of the second input. In this case "a" is 1 and "b" is 4.`);
    newParagraph(`The "return" keyword is used to return the value that the function computed.`);
    newParagraph(`*It is important to know that functions use the same indentation logic as conditionals to contain their code.`);
    newParagraph(`Functions can be used to easily execute the same code many times, which makes them very useful.`);
    newParagraph(`Try writing your own function!`);
} else if (lessonNumber == 9) {
    setTitle("Lists", 9);

    newParagraph(`You already learned the basics of list but they have a few extra operations because they can uniquely hold multiple data points. The way you access list data is through indexing. List indexing is done with brackets and looks like this:`);
    newCodeBlock(`a = [3, 9, 4, 7]\nprint(a[0])`);
    newParagraph(`This program prints the first item of the list "a".`);
    newParagraph(`Indexing can also be used to modify data. For example, this sets the second item in the list to 47.`);
    newCodeBlock(`a = [1, 2, 3, 4]\na[1] = 47`);
    newParagraph(`*It is important to note that in Python list indexing starts at 0 for the first item.`);
    newParagraph(`Lists also have built-in functions that can be called on them. The most important of these functions are:`);

    newTable(["Name", "Method", "Operation"], [
        ["Append", "list.append(x)", "Adds the input to the end of the list."],
        ["Remove", "list.remove(x)", "Removes the first occurrence of the input in the list."],
        ["Index", "list.index(x)", "Returns the index of the first time that the input appears in the list."],
        ["Length", "len(list)", "Returns the number of items in the input."]
    ]);

    newParagraph(`The reason some of these functions begin with "list" and then call the function on the list is because they are list-only operations. These functions are built into the "list" type and can only be called on a list. The "len" function however is a global built-in function and works with many types, such as strings and lists.`);
    newParagraph(`Try running and modifying the program below and see how these functions work.`);
} else if (lessonNumber == 10) {
    setTitle("Strings", 10);

    newParagraph(`Like lists, strings have some custom behavior that is used to manipulate the data inside them. The most common operation done on strings is combining them. This is done simply with the "+" operator, like this:`);
    newCodeBlock(`a = "Hello"\nprint(a + " World!")`);
    newParagraph(`This program prints "Hello World!"`);
    newParagraph(`Strings can also be indexed the same way as lists, however strings can not be assigned values through indexing.`);
    newParagraph(`For example this prints "d":`);
    newCodeBlock(`letters = "abcdefghijk"\nprint(letters[3])`);
    newParagraph(`But this program throws an error:`);
    newCodeBlock(`letters = "abcdefghijk"\nletters[3] = "u"`);
    newParagraph(`Additionally indexing can also include ranges instead of single values. For example this prints "bcd":`);
    newCodeBlock(`letters = "abcdefghijk"\nprint(letters[1:4])`);
    newParagraph(`*Ranged indexing works for lists too.`);
    newParagraph(`*The "len" function also works on strings and returns the number of characters.`);
    newParagraph(`Try editing your own strings!`);
} else if (lessonNumber == 11) {
    setTitle("For loops", 11);

    newParagraph(`In Python, for loops are used to perform a task multiple times or loop through the items of a list. For example, a for loop that repeats 20 times looks like this:`);
    newCodeBlock(`for i in range(20):\n    print(i)`);
    newParagraph(`This loop prints the numbers 0 through 19.`);
    newParagraph(`For loops can also be used to loop through the items of a list. For example, this program adds one to every number in a list:`);
    newCodeBlock(`numbers = [8, 2, 5, 6, 3]\nnew_numbers = []\n\nfor number in numbers:\n    new_numbers.append(number + 1)\n\nprint(new_numbers)`);
    newParagraph(`Try writing your own for loops!`);
} else if (lessonNumber == 12) {
    setTitle("Input", 12);

    newParagraph(`The last piece of the input/processing/output system needed is input. Input from the user in Python is done through the input function.`);
    newParagraph(`That function looks like this:`);
    newCodeBlock(`i = input("What is your name?")`);
    newParagraph(`The variable "i" will be set to whatever the user inputs as response to the question.`);
    newParagraph(`The user can input their response to the question through the terminal.`);
    newParagraph(`While it seems simple, this function unlocks communication with the user while the program is running!`);
    newParagraph(`Try writing your own program with the input function that uses conditionals to make a custom response based on what the user says.`);
}

setupPython();