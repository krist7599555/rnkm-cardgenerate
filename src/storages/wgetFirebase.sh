
while IFS=" " read -r f url
do
  # echo OK
  # echo $url
  if [ ! -f "$f" ]
  then
    # echo $f
    wget -O "$f" "$url"
  fi
done < "../wgetFirebase.txt"
