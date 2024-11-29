package pt_online_schema_change_plugin;

sub new {
    my ($class, %args) = @_;
    return bless {}, $class;
}

sub before_create_triggers {
    my ($self, %args) = @_;
    print "Skipping create triggers...\n";
}

1;
