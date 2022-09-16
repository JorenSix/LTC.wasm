# Unpacks a binary file with floats to a JSON representation
# The raw file is expected to use 32 bit floats as samples
contents = File.read("test.raw")
floats = contents.unpack("f*")
puts "var test_smpte_data = ["
puts floats.join(",\n")
puts "]"
